'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { envioEmailRepository } from './repository';
import type { IEnvio, IEnvioDetalle, IEnvioPrueba, IEnvioPruebaRespuesta, ILote } from './types';

export async function obtenerDetalleEnvioEmailAction(envioId: string): Promise<ActionResult<IEnvioDetalle>> {
  try {
    return { success: true, data: await envioEmailRepository.detalle(envioId) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cancelarEnvioEmailAction(envioId: string): Promise<ActionResult<IEnvio>> {
  try {
    return { success: true, data: await envioEmailRepository.cancelar(envioId) };
  } catch (error) {
    return handleError(error);
  }
}

export async function reintentarEnvioEmailAction(envioId: string): Promise<ActionResult<IEnvio>> {
  try {
    return { success: true, data: await envioEmailRepository.reintentar(envioId) };
  } catch (error) {
    return handleError(error);
  }
}

export async function obtenerLoteEmailAction(loteId: string): Promise<ActionResult<ILote>> {
  try {
    return { success: true, data: await envioEmailRepository.lote(loteId) };
  } catch (error) {
    return handleError(error);
  }
}

export async function enviarPruebaEmailAction(payload: IEnvioPrueba): Promise<ActionResult<IEnvioPruebaRespuesta>> {
  try {
    return { success: true, data: await envioEmailRepository.enviarPrueba(payload) };
  } catch (error) {
    return handleError(error);
  }
}
