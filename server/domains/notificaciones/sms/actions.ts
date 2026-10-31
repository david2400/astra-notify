'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import type { ILoteColaAceptado } from '../cola';
import { envioSmsRepository } from './repository';
import type { IEnviarSms, IEnviarSmsLote, ISmsEnvio, ISmsLoteResultado, ISmsResultado } from './types';

/** Encola el SMS en notificacion y espera unos segundos el resultado (si no, queda "en proceso"). */
export async function enviarSmsAction(payload: IEnviarSms, idempotencyKey?: string): Promise<ActionResult<ISmsResultado>> {
  try {
    return { success: true, data: await envioSmsRepository.enviar(payload, idempotencyKey) };
  } catch (error) {
    return handleError(error);
  }
}

/** Estado actual de un SMS de la cola (para "Actualizar" cuando quedó en proceso). */
export async function consultarSmsAction(envioId: string): Promise<ActionResult<ISmsResultado>> {
  try {
    return { success: true, data: await envioSmsRepository.resultado(envioId) };
  } catch (error) {
    return handleError(error);
  }
}

export async function enviarSmsLoteAction(payload: IEnviarSmsLote): Promise<ActionResult<ISmsLoteResultado>> {
  try {
    return { success: true, data: await envioSmsRepository.enviarLote(payload) };
  } catch (error) {
    return handleError(error);
  }
}

/** Resultado actual de un lote de la cola (los bloques ya conocidos y su total). */
export async function consultarSmsLoteAction(
  lote: Pick<ILoteColaAceptado, 'lote_id' | 'envios' | 'total_destinatarios'>,
  plantilla?: string | null,
): Promise<ActionResult<ISmsLoteResultado>> {
  try {
    const aceptado: ILoteColaAceptado = {
      ...lote,
      canal: 'SMS',
      total_envios: lote.envios?.length ?? 0,
      duplicado: false,
    };
    return { success: true, data: await envioSmsRepository.resultadoLote(aceptado, plantilla ?? undefined) };
  } catch (error) {
    return handleError(error);
  }
}

/** Detalle de entrega en sms_gateway (historial). */
export async function obtenerEnvioSmsAction(envioId: string): Promise<ActionResult<ISmsEnvio>> {
  try {
    return { success: true, data: await envioSmsRepository.detalle(envioId) };
  } catch (error) {
    return handleError(error);
  }
}
