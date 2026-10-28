/** @format */

/** Historial de notificaciones: SMS (sms_gateway, GET /v1/sms/envios) y correo (email_gateway, GET /v1/email/envios). */
export type { ISmsEnvio, IFiltroSms, IPaginaSms, EstadoSms } from '@/server/domains/notificaciones/sms/types';

/** Canal del historial (pestañas). */
export type CanalHistorial = 'sms' | 'correo';

export const ESTADOS_SMS = [
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'FALLIDO', label: 'Fallido' },
];

/** sms_gateway guarda fechas locales sin zona (LocalDateTime): se muestran tal cual en hora local. */
export function fechaSms(valor?: string | null): string {
  if (!valor) return '--';
  const d = new Date(valor.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });
}
