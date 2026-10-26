/** @format */

import NextAuth, { type NextAuthResult } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { accessControlFetch } from '@/server/lib/server-fetch';

/**
 * Login de astra-notify contra access_control (mismo esquema que draco).
 *
 * Dos modos, elegidos por variable de entorno:
 *
 * - OIDC (nuevo, Fase 4 del plan de seguridad): si AUTH_ACCESS_CONTROL_SECRET esta
 *   definida, astra-notify es un cliente OAuth 2.1 confidencial ("astra-notify-web") del servidor de
 *   autorizacion de access_control: authorization code + PKCE, el usuario escribe la
 *   contraseña en access_control (nunca en astra-notify), elige empresa y aplicacion alli y
 *   astra-notify recibe un access token RS256 de 10 min con SOLO los permisos de ese contexto y
 *   un refresh token rotativo. Los tokens viven en la cookie cifrada de Auth.js (servidor),
 *   nunca en el navegador.
 * - Credentials (viejo): POST /auth/login con usuario y contraseña. Se mantiene mientras
 *   la migracion no termine (Fase 5 lo retira).
 */

const ISSUER = (process.env.AUTH_ACCESS_CONTROL_ISSUER ?? 'http://localhost:8000').replace(/\/+$/, '');
const CLIENT_ID = process.env.AUTH_ACCESS_CONTROL_CLIENT_ID ?? 'astra-notify-web';

/**
 * Nombre propio de la cookie de sesion: en localhost las cookies no distinguen puerto, asi que
 * con el nombre por defecto de Auth.js iniciar sesion en otra app del monorepo (draco, libra...)
 * pisaria la sesion de esta.
 */
export const SESSION_COOKIE = 'astra-notify.session-token';
const CLIENT_SECRET = process.env.AUTH_ACCESS_CONTROL_SECRET;

/** true si el login va por el servidor de autorizacion de access_control. */
export const OIDC_HABILITADO = Boolean(CLIENT_SECRET);

/**
 * El login es OPCIONAL: se puede entrar sin sesión. Con AUTH_REQUIRED=true el middleware vuelve a
 * exigirla (manda al login). Si alguien inicia sesión, sus datos y su token se usan igual.
 */
export const LOGIN_OBLIGATORIO = process.env.AUTH_REQUIRED === 'true';

/** Sin AUTH_SECRET Auth.js no puede leer ni firmar la cookie: se trabaja siempre sin sesión. */
export const AUTH_CONFIGURADO = Boolean(process.env.AUTH_SECRET);
export const OIDC_PROVIDER_ID = 'access-control';

interface AccessControlLoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at: string;
  user: {
    id: number;
    username: string;
    email?: string | null;
    company_id?: number | null;
    user_type: string;
    status: string;
    roles: string[];
    permissions: string[];
  };
}

/** Claims del access token de contexto (ver TokenContextoCustomizer en access_control). */
interface ClaimsContexto {
  sub: string;
  exp: number;
  ctx?: {
    user_application_id?: number;
    company_id?: number;
    company_application_id?: number;
    application?: string;
  };
  roles?: string[];
  permissions?: string[];
  user_type?: string;
}

/**
 * Lee los claims SIN verificar la firma: el token llega directo del endpoint /oauth2/token
 * de access_control por el canal servidor-servidor, no del navegador. Los backends que lo
 * reciben si verifican la firma.
 */
function claimsDe(accessToken: string): ClaimsContexto {
  const payload = accessToken.split('.')[1] ?? '';
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ClaimsContexto;
}

function conTokensDeContexto(token: JWT, accessToken: string, refreshToken?: string): JWT {
  const c = claimsDe(accessToken);
  token.sub = c.sub;
  token.accessToken = accessToken;
  token.refreshToken = refreshToken ?? token.refreshToken;
  token.accessTokenExpiresAt = new Date(c.exp * 1000).toISOString();
  token.companyId = c.ctx?.company_id ?? null;
  token.userApplicationId = c.ctx?.user_application_id ?? null;
  token.application = c.ctx?.application ?? null;
  token.userType = c.user_type;
  // Roles y permisos NO se copian a la cookie: ya vienen dentro del access token y se leen de
  // ahi en session(). Asi la cookie pesa menos (en localhost el navegador manda las cookies de
  // todas las apps a cada puerto y Tomcat rechazaba cabeceras de mas de 8 KB).
  delete token.roles;
  delete token.permissions;
  delete token.error;
  return token;
}

/**
 * Renovaciones en curso por refresh token. El refresh de access_control rota en cada uso:
 * si dos peticiones simultaneas renovaran con el mismo, la segunda fallaria y cerraria la
 * sesion. Se comparte la misma promesa dentro del proceso.
 */
// En globalThis: el middleware y las paginas se compilan por separado (cada uno tendria su
// propio Map) pero corren en el mismo proceso de Node. Asi ambos comparten la misma renovacion
// y la pagina no reusa el refresh token viejo (access_control lo tomaria como robo y cerraria
// la sesion completa).
const globalRenovaciones = globalThis as typeof globalThis & {
  __astraNotifyRenovaciones?: Map<string, Promise<JWT | null>>;
};
const renovacionesEnCurso = (globalRenovaciones.__astraNotifyRenovaciones ??= new Map<string, Promise<JWT | null>>());

async function renovar(token: JWT): Promise<JWT | null> {
  const refresh = token.refreshToken;
  if (!refresh || !CLIENT_SECRET) return null;
  const enCurso = renovacionesEnCurso.get(refresh);
  if (enCurso) return enCurso;

  const promesa = (async () => {
    try {
      const respuesta = await fetch(`${ISSUER}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${encodeURIComponent(CLIENT_ID)}:${encodeURIComponent(CLIENT_SECRET)}`).toString('base64')}`,
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
        cache: 'no-store',
      });
      if (!respuesta.ok) {
        // Sesion vencida (8 h), contexto revocado o refresh reusado: hay que volver a entrar.
        console.warn('access_control rechazo la renovacion del token:', respuesta.status);
        return null;
      }
      const datos = (await respuesta.json()) as { access_token: string; refresh_token?: string };
      return conTokensDeContexto({ ...token }, datos.access_token, datos.refresh_token);
    } catch (error) {
      console.error('No se pudo renovar el token con access_control:', error);
      return null;
    } finally {
      setTimeout(() => renovacionesEnCurso.delete(refresh), 60_000);
    }
  })();
  renovacionesEnCurso.set(refresh, promesa);
  return promesa;
}

const result = NextAuth({
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' },
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    ...(OIDC_HABILITADO
      ? [
          {
            id: OIDC_PROVIDER_ID,
            name: 'Essenza',
            type: 'oidc' as const,
            issuer: ISSUER,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            checks: ['pkce' as const, 'state' as const],
            authorization: { params: { scope: 'openid' } },
            profile(perfil: { sub: string }) {
              return { id: perfil.sub };
            },
          },
        ]
      : []),
    Credentials({
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        try {
          const response = await accessControlFetch.post<AccessControlLoginResponse>(
            '/auth/login',
            { username, password },
          );

          return {
            id: String(response.user.id),
            name: response.user.username,
            email: response.user.email ?? undefined,
            accessToken: response.access_token,
            accessTokenExpiresAt: response.expires_at,
            companyId: response.user.company_id ?? null,
            userType: response.user.user_type,
            roles: response.user.roles ?? [],
            permissions: response.user.permissions ?? [],
          };
        } catch (error) {
          // Credenciales invalidas u otro error de access_control: el
          // formulario de login solo necesita saber que fallo.
          console.error('Error de autenticacion contra access_control:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * Por defecto Auth.js solo redirige dentro de astra-notify. Se permite ademas access_control,
     * para que "Cerrar sesion" pueda pasar por /connect/logout y cerrar tambien alla.
     */
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try {
        const destino = new URL(url);
        if (destino.origin === baseUrl || (OIDC_HABILITADO && destino.origin === new URL(ISSUER).origin)) {
          return url;
        }
      } catch {
        // URL invalida: se vuelve al inicio
      }
      return baseUrl;
    },
    async jwt({ token, user, account, profile }) {
      // Login o cambio de empresa por OIDC: llegan tokens nuevos de access_control.
      if (account?.provider === OIDC_PROVIDER_ID && account.access_token) {
        // El id_token solo se guarda para el cierre de sesion en access_control (id_token_hint).
        token.idToken = account.id_token ?? token.idToken;
        // Datos para el menu de la cuenta (claims del id_token, ver agregarPerfil en access_control).
        if (profile) {
          const p = profile as Record<string, unknown>;
          const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);
          token.username = texto(p.preferred_username) ?? token.username ?? null;
          token.name = texto(p.name) ?? token.username ?? token.name ?? null;
          token.companyName = texto(p.company_name);
          token.applicationName = texto(p.application_name);
        }
        return conTokensDeContexto(token, account.access_token, account.refresh_token);
      }
      // Login viejo por usuario y contraseña.
      if (user && account?.provider === 'credentials') {
        token.accessToken = user.accessToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.username = user.name ?? null;
        token.companyId = user.companyId ?? null;
        token.userType = user.userType;
        token.roles = user.roles ?? [];
        token.permissions = user.permissions ?? [];
      }

      const vence = token.accessTokenExpiresAt ? Date.parse(token.accessTokenExpiresAt) : undefined;
      // Con OIDC se renueva 30 s antes de vencer; sin refresh token (login viejo) se cierra la sesion.
      if (token.refreshToken) {
        if (vence && vence - 30_000 > Date.now()) return token;
        return renovar(token);
      }
      if (vence && vence <= Date.now()) {
        return null;
      }
      return token;
    },
    async session({ session, token }) {
      const jwtToken = token as JWT;
      if (session.user) {
        session.user.id = jwtToken.sub as string;
        session.user.name = jwtToken.name ?? jwtToken.username ?? null;
        session.user.username = jwtToken.username ?? null;
        session.user.companyName = jwtToken.companyName ?? null;
        session.user.applicationName = jwtToken.applicationName ?? null;
        session.user.companyId = jwtToken.companyId ?? null;
        session.user.userApplicationId = jwtToken.userApplicationId ?? null;
        session.user.application = jwtToken.application ?? null;
        session.user.userType = jwtToken.userType;
        const claims = jwtToken.refreshToken && jwtToken.accessToken ? claimsDe(jwtToken.accessToken) : null;
        session.user.roles = claims?.roles ?? jwtToken.roles ?? [];
        session.user.permissions = claims?.permissions ?? jwtToken.permissions ?? [];
      }
      // El refresh token NUNCA va a la sesion: session() se puede exponer al navegador.
      session.accessToken = jwtToken.accessToken;
      return session;
    },
  },
});

export const handlers: NextAuthResult['handlers'] = result.handlers;
// Sin AUTH_SECRET, auth() sin argumentos (lectura de sesión en páginas y server actions) devuelve
// null en vez de fallar; los demás usos (envolver middleware/handlers) siguen yendo a Auth.js.
export const auth: NextAuthResult['auth'] = AUTH_CONFIGURADO
  ? result.auth
  : (((...args: unknown[]) =>
      args.length === 0 ? Promise.resolve(null) : (result.auth as (...a: unknown[]) => unknown)(...args)) as NextAuthResult['auth']);
export const signIn: NextAuthResult['signIn'] = result.signIn;
export const signOut: NextAuthResult['signOut'] = result.signOut;
