/** @format */

export type { ICuenta, ICrearCuenta, IActualizarCuenta, IVerificacionCuenta } from '@/server/domains/administre/email/cuentas/types';

export type ModoAuthGmail = 'APP_PASSWORD' | 'OAUTH2';

/** Valores del formulario (parametros se edita como texto JSON; authMode se maneja aparte para Gmail). */
export interface ICuentaForm {
  proveedor: string;
  codigo: string;
  usuario: string;
  remitente_email: string;
  remitente_nombre: string;
  auth_mode: ModoAuthGmail;
  clave: string;
  oauth_client_id: string;
  oauth_client_secret: string;
  oauth_refresh_token: string;
  secret_ref: string;
  eliminar_clave: boolean;
  parametros: string;
}

export const CUENTA_FORM_DEFAULT: ICuentaForm = {
  proveedor: '',
  codigo: '',
  usuario: '',
  remitente_email: '',
  remitente_nombre: '',
  auth_mode: 'APP_PASSWORD',
  clave: '',
  oauth_client_id: '',
  oauth_client_secret: '',
  oauth_refresh_token: '',
  secret_ref: '',
  eliminar_clave: false,
  parametros: '{}',
};

/** Parámetros sugeridos por proveedor (se pueden editar). */
export const PARAMETROS_SUGERIDOS: Record<string, Record<string, unknown>> = {
  GMAIL: { port: 587, batchSize: 50, dailyLimit: 450 },
  BREVO: { batchSize: 100, rateLimitPerSecond: 10, sandbox: false },
  MOCK: { latencyMs: 50 },
};

export const AYUDA_PARAMETROS =
  'Gmail: port, ssl, starttls, batchSize, dailyLimit (≈500/día personal, 2000 Workspace). ' +
  'Brevo: batchSize, rateLimitPerSecond/rateLimitPerMinute, sandbox. Todos: dailyLimit, quotaZone.';
