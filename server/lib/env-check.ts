/**
 * Avisos de configuración al arrancar (ver instrumentation.ts). Solo escribe en la consola del
 * servidor: la app sigue funcionando con los valores por defecto cuando los hay.
 */

/** Variables que existían antes y ya no se leen: si siguen en el .env se avisa para quitarlas. */
const OBSOLETAS: Record<string, string> = {
  AUTH_DISABLED: 'el login ya es opcional por defecto; usa AUTH_REQUIRED=true para exigirlo',
  SMS_GATEWAY_API_URL: 'el frontend ya no llama a sms_gateway: todo pasa por notificacion (NOTIFICACION_API_URL)',
  NEXT_PUBLIC_SMS_GATEWAY_API_URL: 'el frontend ya no llama a sms_gateway: todo pasa por notificacion (NOTIFICACION_API_URL)',
  EMAIL_GATEWAY_API_URL: 'el frontend ya no llama a email_gateway: todo pasa por notificacion (NOTIFICACION_API_URL)',
  NEXT_PUBLIC_EMAIL_GATEWAY_API_URL: 'el frontend ya no llama a email_gateway: todo pasa por notificacion (NOTIFICACION_API_URL)',
};

const definida = (nombre: string) => Boolean(process.env[nombre]?.trim());

export function verificarEntorno(): string[] {
  const avisos: string[] = [];
  const produccion = process.env.NODE_ENV === 'production';

  if (!definida('NOTIFICACION_API_URL') && !definida('NEXT_PUBLIC_NOTIFICACION_API_URL')) {
    avisos.push(
      produccion
        ? 'NOTIFICACION_API_URL no está definida: la administración y los envíos no podrán conectarse a notificacion.'
        : `NOTIFICACION_API_URL no está definida: se usa http://localhost:${process.env.DEV_NOTIFICACION_PORT ?? 9001}.`,
    );
  }

  if (!definida('AUTH_SECRET')) {
    avisos.push('AUTH_SECRET no está definida: nadie puede iniciar sesión y todas las páginas se abren sin usuario.');
    if (process.env.AUTH_REQUIRED === 'true') {
      avisos.push('AUTH_REQUIRED=true no tiene efecto sin AUTH_SECRET: el login no se puede exigir.');
    }
    if (definida('AUTH_ACCESS_CONTROL_SECRET')) {
      avisos.push('AUTH_ACCESS_CONTROL_SECRET está definida pero sin AUTH_SECRET el login OIDC no funciona.');
    }
  }

  for (const [nombre, motivo] of Object.entries(OBSOLETAS)) {
    if (process.env[nombre] !== undefined) {
      avisos.push(`${nombre} ya no se usa (${motivo}). Puedes quitarla del .env.`);
    }
  }

  for (const aviso of avisos) console.warn(`⚠️  [env] ${aviso}`);
  return avisos;
}
