'use server';

import {
  enviarSmsAction,
  enviarSmsLoteAction,
  type IEnviarSms,
  type IEnviarSmsLote,
} from '@/server/domains/notificaciones/sms';

export async function enviarSmsServerAction(payload: IEnviarSms, idempotencyKey?: string) {
  return enviarSmsAction(payload, idempotencyKey);
}

export async function enviarSmsLoteServerAction(payload: IEnviarSmsLote) {
  return enviarSmsLoteAction(payload);
}
