'use server';

import {
  consultarSmsAction,
  consultarSmsLoteAction,
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

export async function consultarSmsServerAction(envioId: string) {
  return consultarSmsAction(envioId);
}

export async function consultarSmsLoteServerAction(
  lote: { lote_id: string; envios: string[]; total_destinatarios: number },
  plantilla?: string | null,
) {
  return consultarSmsLoteAction(lote, plantilla);
}
