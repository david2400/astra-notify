import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextMiddleware} from 'next/server';
import {routing} from './shared/i18n/routing';
import {auth} from './auth';
import {COOKIE_ULTIMA_RUTA} from './server/lib/ruta-retorno';

const intl = createMiddleware(routing);

/** Rutas que no exigen sesion (sin el prefijo de idioma). */
const RUTAS_PUBLICAS = ['/auth/'];

/**
 * 1) Auth.js envuelve el middleware de idiomas para RENOVAR el token de access_control: el access
 *    token dura 10 min y la renovacion (callback jwt de auth.ts) solo queda guardada donde se puede
 *    escribir la cookie de sesion. En un Server Component no se puede; aqui si.
 * 2) Sin sesion (nunca entro, cerro sesion, o la renovacion fallo porque la sesion de access_control
 *    vencio o fue revocada: el callback jwt devuelve null) se manda al login.
 */
const middleware = auth((req) => {
  const {pathname} = req.nextUrl;
  const sinIdioma = pathname.replace(/^\/(es|en)(?=\/|$)/, '') || '/';
  const esPublica = RUTAS_PUBLICAS.some((r) => sinIdioma.startsWith(r));

  if (!esPublica && !req.auth) {
    const idioma = pathname.match(/^\/(es|en)(?=\/|$)/)?.[1] ?? routing.defaultLocale;
    const login = new URL(`/${idioma}/auth/login`, req.nextUrl.origin);
    login.searchParams.set('expirada', '1');
    // Para volver a esta misma pagina (con sus filtros) despues de iniciar sesion.
    login.searchParams.set('callbackUrl', pathname + req.nextUrl.search);
    return NextResponse.redirect(login);
  }
  const respuesta = intl(req);
  if (!esPublica) {
    // Ultima pagina visitada: si un backend responde 401 mientras se arma la pagina o en una
    // accion, server-fetch la usa como destino de vuelta tras el login.
    respuesta.cookies.set(COOKIE_ULTIMA_RUTA, pathname + req.nextUrl.search, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }
  return respuesta;
});

// Tipo explicito: el inferido de auth() apunta a tipos internos de next-auth y tsc no lo puede exportar (TS2742).
export default middleware as unknown as NextMiddleware;

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
  // auth.ts usa APIs de Node (Buffer, fetch al emisor): el middleware corre en Node, no en Edge.
  runtime: 'nodejs',
};
