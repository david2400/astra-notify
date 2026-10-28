'use server';

import { handleError } from '@/server/lib/handlers';
import { ServerApiError } from '@/server/lib/types';
import type { ActionResult } from '@/server/lib/types/action.type';
import { envioSmsRepository } from './repository';
import type { IEnviarSms, IEnviarSmsLote, ISmsEnvio, ISmsLoteResultado, ISmsResultado } from './types';

/** El gateway responde 502 (todas las cuentas fallaron) o 422 con el resultado del envío: se devuelve como dato. */
function resultadoEnError(error: unknown): ISmsResultado | null {
  if (error instanceof ServerApiError) {
    const body = error.details as Partial<ISmsResultado> | undefined;
    if (body && typeof body === 'object' && body.envio_id) return body as ISmsResultado;
  }
  return null;
}

export async function enviarSmsAction(payload: IEnviarSms, idempotencyKey?: string): Promise<ActionResult<ISmsResultado>> {
  try {
    return { success: true, data: await envioSmsRepository.enviar(payload, idempotencyKey) };
  } catch (error) {
    const resultado = resultadoEnError(error);
    if (resultado) return { success: true, data: resultado };
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

export async function obtenerEnvioSmsAction(envioId: string): Promise<ActionResult<ISmsEnvio>> {
  try {
    return { success: true, data: await envioSmsRepository.detalle(envioId) };
  } catch (error) {
    return handleError(error);
  }
}
