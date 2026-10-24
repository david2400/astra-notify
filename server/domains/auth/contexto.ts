'use server';

import { unstable_rethrow } from 'next/navigation';
import { headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { auth, signIn, signOut, OIDC_HABILITADO, OIDC_PROVIDER_ID, SESSION_COOKIE } from '@/auth';
import { accessControlFetch } from '@/server/lib/server-fetch';
import { rutaRetornoSegura } from '@/server/lib/ruta-retorno';

/** Una empresa + aplicacion en la que el usuario puede trabajar (ContextoDisponible en access_control). */
export interface IContexto {
  user_application_id: number;
  company_id: number;
  company_name: string;
  company_application_id: number;
  application_id: number;
  application_name: string;
}

/** Datos de la persona logueada para el menu de la cuenta (nunca incluye tokens). */
export interface IUsuarioActual {
  nombre: string;
  usuario: string | null;
  empresa: string | null;
  aplicacion: string | null;
  roles: string[];
}

export async function usuarioActual(): Promise<IUsuarioActual | null> {
  const session = await auth();
  const u = session?.user;
  if (!u) return null;
  return {
    nombre: u.name ?? u.username ?? 'Usuario',
    usuario: u.username ?? null,
    empresa: u.companyName ?? null,
    aplicacion: u.applicationName ?? null,
    roles: u.roles ?? [],
  };
}

/** user_application_id del contexto con el que entro el usuario (null sin OIDC). */
export async function contextoActual(): Promise<number | null> {
  const session = await auth();
  return session?.user?.userApplicationId ?? null;
}

/** Contextos validos del usuario actual. Vacio si el login no es OIDC o si access_control falla. */
export async function listarContextos(): Promise<IContexto[]> {
  if (!OIDC_HABILITADO) return [];
  try {
    // accessControlFetch antepone /api/access_control.
    return await accessControlFetch.get<IContexto[]>('/auth/me/contexts');
  } catch (error) {
    unstable_rethrow(error);
    console.error('No se pudieron leer los contextos del usuario:', error);
    return [];
  }
}

/**
 * Cambia de empresa/aplicacion pidiendo a access_control un token para otro contexto. La
 * sesion de access_control sigue abierta, asi que no vuelve a pedir la contraseña; si el
 * contexto ya no es valido access_control responde 403 y el usuario se queda donde estaba.
 */
export async function cambiarContexto(userApplicationId: number): Promise<void> {
  if (!OIDC_HABILITADO || !Number.isInteger(userApplicationId) || userApplicationId <= 0) return;
  await signIn(OIDC_PROVIDER_ID, { redirectTo: '/' }, { ctx: String(userApplicationId) });
}

/** Inicia el login OIDC (boton de la pagina de login). */
export async function iniciarSesionOidc(formData?: FormData): Promise<void> {
  const volverA = rutaRetornoSegura(formData?.get('callbackUrl')?.toString());
  await signIn(OIDC_PROVIDER_ID, { redirectTo: volverA });
}

/**
 * Cierra la sesion de astra-notify y, con OIDC, tambien la de access_control (si no, el siguiente
 * "Iniciar sesion" entraria sin pedir contraseña).
 */
export async function cerrarSesion(): Promise<void> {
  const issuer = (process.env.AUTH_ACCESS_CONTROL_ISSUER ?? 'http://localhost:8000').replace(/\/+$/, '');
  const volver = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  if (OIDC_HABILITADO) {
    // El id_token vive solo en la cookie cifrada de Auth.js; se lee aqui, del lado del servidor.
    const jwt = await getToken({
      req: { headers: await headers() },
      secret: process.env.AUTH_SECRET,
      cookieName: SESSION_COOKIE,
      secureCookie: volver.startsWith('https://'),
    });
    if (jwt?.idToken) {
      // access_control (OIDC RP-initiated logout) exige id_token_hint.
      await signOut({
        redirectTo: `${issuer}/connect/logout?id_token_hint=${encodeURIComponent(jwt.idToken)}`
          + `&post_logout_redirect_uri=${encodeURIComponent(`${volver.replace(/\/+$/, '')}/auth/login`)}`,
      });
      return;
    }
  }
  await signOut({ redirectTo: '/auth/login' });
}
