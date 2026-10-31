import 'server-only';

import { cookies, headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from './env';
import { COOKIE_ULTIMA_RUTA, rutaRetornoSegura } from './ruta-retorno';
import { ServerApiError, type ServerFetchOptions } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildUrl(path: string, params?: Record<string, unknown>, baseUrl?: string): string {
  const url = new URL(path, baseUrl ?? env.apiBaseUrl);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Token real de access_control guardado en la sesión de Auth.js (ver
  // auth.ts). Es lo que valida el backend; la cookie de sesión de abajo es
  // un JWE de Auth.js que ningún servicio puede verificar y queda solo como
  // compatibilidad. Import dinámico: auth.ts importa este módulo.
  try {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (session?.accessToken) {
      return { Authorization: `Bearer ${session.accessToken}` };
    }
  } catch {
    // Fuera de un request (build) o sin sesión: se sigue con el fallback.
  }

  try {
    const cookieStore = await cookies();
    const token =
      // = SESSION_COOKIE de auth.ts (no se importa: auth.ts importa este módulo)
      cookieStore.get('astra-notify.session-token')?.value;

    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Outside of a request context (e.g. build time) – skip auth.
  }
  return {};
}

async function forwardedHeaders(): Promise<Record<string, string>> {
  try {
    const reqHeaders = await nextHeaders();
    const forwarded: Record<string, string> = {};
    const acceptLang = reqHeaders.get('accept-language');
    if (acceptLang) forwarded['Accept-Language'] = acceptLang;
    return forwarded;
  } catch {
    return {};
  }
}

/**
 * Manda al login conservando la pagina actual (cookie astra_notify_ultima_ruta). Lanza NEXT_REDIRECT.
 * Se usa cuando el backend responde 401 o cuando no hay sesion al armar una pagina.
 */
export async function redirigirAlLogin(): Promise<never> {
  let volverA = '/';
  try {
    volverA = rutaRetornoSegura((await cookies()).get(COOKIE_ULTIMA_RUTA)?.value);
  } catch {
    // fuera de un request: se vuelve al inicio
  }
  redirect(`/auth/login?expirada=1&callbackUrl=${encodeURIComponent(volverA)}`);
}

async function handleResponse<T>(response: Response): Promise<T> {
  // 401 = el backend no acepto el token (vencido, revocado o ausente): se vuelve a iniciar sesion.
  // La pagina de login muestra el boton "Continuar" (no redirige sola), asi que no hay bucle; si la
  // sesion de access_control sigue viva, entra sin pedir la contraseña otra vez.
  // redirect() lanza NEXT_REDIRECT: los try/catch que hacen "throw error" lo dejan pasar.
  if (response.status === 401) {
    await redirigirAlLogin();
  }
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => null);
    }

    // Extract the most specific error message from the response body
    const errorMessage = extractErrorMessage(body, response.status);
    
    // Create a properly structured ServerApiError that can be caught
    const serverError = new ServerApiError({
      message: errorMessage,
      status: response.status,
      code: (body as any)?.code,
      details: body,
    });

    // Ensure the error can be properly caught by try-catch
    throw serverError;
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // 200 sin cuerpo (p. ej. endpoints void de los gateways): no se intenta parsear JSON vacío
  const texto = await response.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}

// Helper function to extract error messages from various response formats
function extractErrorMessage(body: unknown, status: number): string {
  // If body is null or undefined, return status-based message
  if (!body) {
    return `API request failed with status ${status}`;
  }

  // If body is a string, return it directly
  if (typeof body === 'string') {
    return body;
  }

  // If body is an object, try to extract the message from common properties
  if (typeof body === 'object' && body !== null) {
    const bodyObj = body as any;
    
    // Common error message properties in order of preference
    // sms_gateway SmsErrorResponse de plantillas: { detalle, errores: [{ variable, codigo, mensaje }] }
    // Se listan las variables con problema (desconocidas, faltantes, formato), no solo el resumen.
    if (Array.isArray(bodyObj.errores) && bodyObj.errores.length > 0) {
      const mensajes = bodyObj.errores
        .map((e: { mensaje?: unknown }) => (typeof e?.mensaje === 'string' ? e.mensaje : null))
        .filter(Boolean);
      if (mensajes.length) {
        // sms_gateway usa `detalle`; email_gateway usa `mensaje` como resumen.
        const titulo = typeof bodyObj.detalle === 'string' ? bodyObj.detalle : bodyObj.mensaje;
        const resumen = typeof titulo === 'string' ? `${titulo}: ` : '';
        return `${resumen}${mensajes.join('; ')}`;
      }
    }

    // sms_gateway (AdminErrorResponse / SmsErrorResponse): { codigo, mensaje, detalles[] }
    if (typeof bodyObj.mensaje === 'string') {
      const detalles = Array.isArray(bodyObj.detalles)
        ? bodyObj.detalles.filter((d: unknown) => typeof d === 'string' && d)
        : [];
      return detalles.length ? `${bodyObj.mensaje}: ${detalles.join('; ')}` : bodyObj.mensaje;
    }

    const messageProps = [
      'detalle',     // sms_gateway SmsErrorResponse / SmsEnvioResponse
      'detail',      // Django/DRF style
      'message',     // Generic REST APIs
      'error',       // Some APIs
      'title',       // Some APIs include title
      'description', // Some APIs include description
      'msg',         // Short form
    ];

    for (const prop of messageProps) {
      if (bodyObj[prop] && typeof bodyObj[prop] === 'string') {
        return bodyObj[prop];
      }
    }

    // If the object has errors array (like validation errors)
    if (Array.isArray(bodyObj.errors) && bodyObj.errors.length > 0) {
      const firstError = bodyObj.errors[0];
      if (typeof firstError === 'string') {
        return firstError;
      }
      if (typeof firstError === 'object' && firstError.message) {
        return firstError.message;
      }
    }

    // If the object has field-specific errors (like validation errors)
    if (bodyObj.errors && typeof bodyObj.errors === 'object') {
      const fieldKeys = Object.keys(bodyObj.errors);
      if (fieldKeys.length > 0) {
        const firstField = fieldKeys[0] as string; // Explicit type assertion
        const fieldErrors = bodyObj.errors[firstField];
        if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
          return fieldErrors[0];
        }
      }
    }
  }

  // Fallback to status-based message
  return `API request failed with status ${status}`;
}

// ─── Core fetch wrapper ─────────────────────────────────────────────────────

async function serverRequest<T>(
  method: string,
  path: string,
  opts: ServerFetchOptions & {
    body?: unknown;
    params?: Record<string, unknown>;
    baseUrl?: string;
  } = {},
): Promise<T> {
  try {
    const { body, params, revalidate, tags, signal, headers: extraHeaders, baseUrl } = opts;

    const [authHeaders, fwdHeaders] = await Promise.all([
      getAuthHeaders(),
      forwardedHeaders(),
    ]);

    const url = buildUrl(path, params, baseUrl);

    const fetchOptions: RequestInit & { next?: Record<string, unknown> } = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders,
        ...fwdHeaders,
        ...extraHeaders,
      },
      signal,
      next: {},
    };

    // Cache strategy
    if (revalidate !== undefined) {
      fetchOptions.next!.revalidate = revalidate;
    }
    if (tags?.length) {
      fetchOptions.next!.tags = tags;
    }

    // Only attach body for methods that support it
    if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(body);
    }

    if (env.isDev) {
      console.log(`[server-fetch] ${method} ${url}`);
    }
    const response = await fetch(url, fetchOptions);
    return handleResponse<T>(response);
  } catch (error) {
    console.error(error);
    throw error;
  }

}

// ─── Public API ─────────────────────────────────────────────────────────────

export const serverFetch = {
  get<T>(path: string, opts?: ServerFetchOptions & { params?: Record<string, unknown> }) {
    return serverRequest<T>('GET', path, opts);
  },

  post<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('POST', path, { ...opts, body });
  },

  put<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('PUT', path, { ...opts, body });
  },

  patch<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('PATCH', path, { ...opts, body });
  },

  delete<T>(path: string, opts?: ServerFetchOptions) {
    return serverRequest<T>('DELETE', path, opts);
  },
} as const;

// ─── access_control client ─────────────────────────────────────────────────
// Mismo wrapper (headers, manejo de errores, cache de Next.js) pero apuntando
// al servicio access_control, que vive en un host/puerto distinto al backend
// de formacion_academica y no comparte el prefijo /api/kleverkids.

/**
 * Todos los controladores de access_control cuelgan de /api/access_control
 * (ApiPrefixConfiguration). Los repositorios pasan la ruta del recurso
 * ("/clients", "/auth/login"...) y aqui se antepone el prefijo una sola vez;
 * si la ruta ya lo trae se deja igual.
 */
const ACCESS_CONTROL_PREFIX = '/api/access_control';

export function rutaAccessControl(path: string): string {
  const conBarra = path.startsWith('/') ? path : `/${path}`;
  return conBarra === ACCESS_CONTROL_PREFIX || conBarra.startsWith(`${ACCESS_CONTROL_PREFIX}/`)
    ? conBarra
    : `${ACCESS_CONTROL_PREFIX}${conBarra}`;
}

export const accessControlFetch = {
  get<T>(path: string, opts?: ServerFetchOptions & { params?: Record<string, unknown> }) {
    return serverRequest<T>('GET', rutaAccessControl(path), { ...opts, baseUrl: env.accessControlBaseUrl });
  },

  post<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('POST', rutaAccessControl(path), { ...opts, body, baseUrl: env.accessControlBaseUrl });
  },

  put<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('PUT', rutaAccessControl(path), { ...opts, body, baseUrl: env.accessControlBaseUrl });
  },

  patch<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('PATCH', rutaAccessControl(path), { ...opts, body, baseUrl: env.accessControlBaseUrl });
  },

  delete<T>(path: string, opts?: ServerFetchOptions) {
    return serverRequest<T>('DELETE', rutaAccessControl(path), { ...opts, baseUrl: env.accessControlBaseUrl });
  },
} as const;

// ─── parametros client ──────────────────────────────────────────────────────
// Mismo wrapper, apuntando al servicio parametros (catalogos: tipos de
// documento, ciudades, etc.), que tampoco comparte host/puerto ni prefijo
// con formacion_academica o access_control.

export const parametrosFetch = {
  get<T>(path: string, opts?: ServerFetchOptions & { params?: Record<string, unknown> }) {
    return serverRequest<T>('GET', path, { ...opts, baseUrl: env.parametrosBaseUrl });
  },

  post<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('POST', path, { ...opts, body, baseUrl: env.parametrosBaseUrl });
  },

  put<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('PUT', path, { ...opts, body, baseUrl: env.parametrosBaseUrl });
  },

  patch<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
    return serverRequest<T>('PATCH', path, { ...opts, body, baseUrl: env.parametrosBaseUrl });
  },

  delete<T>(path: string, opts?: ServerFetchOptions) {
    return serverRequest<T>('DELETE', path, { ...opts, baseUrl: env.parametrosBaseUrl });
  },
} as const;

// ─── notificacion ───────────────────────────────────────────────────────────
// Único backend de notificaciones: administración de canales, envíos (cola asíncrona) y, por su proxy,
// plantillas e historial de entrega de los gateways. Con NOTIFICACION_API_KEY se agrega X-API-Key.

const NOTIFICACION_PREFIX = '/api/notificacion';

function conBarra(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** Cliente de notificacion con el prefijo indicado ('/api/notificacion/v1/...'). */
function clienteNotificacion(prefijo: string) {
  const ruta = (path: string) => {
    const p = conBarra(path);
    return p === prefijo || p.startsWith(`${prefijo}/`) ? p : `${prefijo}${p}`;
  };
  const conClave = <O extends ServerFetchOptions>(opts?: O): O & { baseUrl: string } => {
    const key = env.notificacionApiKey;
    return {
      ...(opts as O),
      baseUrl: env.notificacionBaseUrl,
      headers: key ? { 'X-API-Key': key, ...opts?.headers } : opts?.headers,
    };
  };
  // async: si falta la URL el error llega como promesa rechazada (Promise.allSettled lo atrapa).
  return {
    async get<T>(path: string, opts?: ServerFetchOptions & { params?: Record<string, unknown> }) {
      return serverRequest<T>('GET', ruta(path), conClave(opts));
    },

    async post<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
      return serverRequest<T>('POST', ruta(path), { ...conClave(opts), body });
    },

    async put<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
      return serverRequest<T>('PUT', ruta(path), { ...conClave(opts), body });
    },

    async patch<T>(path: string, body?: unknown, opts?: ServerFetchOptions) {
      return serverRequest<T>('PATCH', ruta(path), { ...conClave(opts), body });
    },

    async delete<T>(path: string, opts?: ServerFetchOptions) {
      return serverRequest<T>('DELETE', ruta(path), conClave(opts));
    },
  } as const;
}

/** notificacion sin prefijo de recurso: los repositorios pasan "/v1/envios/sms", "/v1/envios/{id}"... */
export const notificacionFetch = clienteNotificacion(NOTIFICACION_PREFIX);

// Administración de canales: proveedores, cuentas, tipos de mensaje, servicios y rutas de SMS y EMAIL
// (/api/notificacion/v1/admin/{canal}/...). Los gateways solo leen esa configuración para enviar.

export type CanalAdmin = 'sms' | 'email';

export function rutaNotificacionAdmin(canal: CanalAdmin, path: string): string {
  return `${NOTIFICACION_PREFIX}/v1/admin/${canal}${conBarra(path)}`;
}

/** Cliente de la administración de un canal en notificacion: los repositorios pasan "/proveedores", "/rutas/efectiva"... */
export function notificacionAdminFetch(canal: CanalAdmin) {
  return clienteNotificacion(`${NOTIFICACION_PREFIX}/v1/admin/${canal}`);
}

export const smsAdminFetch = notificacionAdminFetch('sms');
export const emailAdminFetch = notificacionAdminFetch('email');

// ─── sms_gateway por notificacion ───────────────────────────────────────────
// Plantillas e historial de entrega de sms_gateway a través del proxy de notificacion:
// /api/notificacion/v1/gateway/sms/{admin/plantillas|envios} → sms_gateway /v1/sms/... (mismo contrato).
// Los repositorios pasan "/admin/plantillas", "/envios"...

const SMS_GATEWAY_PREFIX = `${NOTIFICACION_PREFIX}/v1/gateway/sms`;

export function rutaSmsGateway(path: string): string {
  const p = conBarra(path);
  return p.startsWith(`${SMS_GATEWAY_PREFIX}/`) ? p : `${SMS_GATEWAY_PREFIX}${p}`;
}

export const smsGatewayFetch = clienteNotificacion(SMS_GATEWAY_PREFIX);

// ─── email_gateway por notificacion ─────────────────────────────────────────
// /api/notificacion/v1/gateway/email/{admin/plantillas|email/envios|email/lotes|email/send} → email_gateway /v1/...
// Los repositorios pasan "/admin/..." o "/email/...".

const EMAIL_GATEWAY_PREFIX = `${NOTIFICACION_PREFIX}/v1/gateway/email`;

export function rutaEmailGateway(path: string): string {
  const p = conBarra(path);
  return p.startsWith(`${EMAIL_GATEWAY_PREFIX}/`) ? p : `${EMAIL_GATEWAY_PREFIX}${p}`;
}

export const emailGatewayFetch = clienteNotificacion(EMAIL_GATEWAY_PREFIX);
