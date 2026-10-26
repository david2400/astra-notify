'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { tipoMensajeEmailRepository } from './repository';
import type { IActualizarTipoMensaje, ICrearTipoMensaje, ITipoMensaje } from './types';

export async function crearTipoMensajeEmailAction(payload: ICrearTipoMensaje): Promise<ActionResult<ITipoMensaje>> {
  try {
    return { success: true, data: await tipoMensajeEmailRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarTipoMensajeEmailAction(payload: IActualizarTipoMensaje): Promise<ActionResult<ITipoMensaje>> {
  try {
    return { success: true, data: await tipoMensajeEmailRepository.update(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoTipoMensajeEmailAction(codigo: string, eliminado: boolean): Promise<ActionResult<ITipoMensaje>> {
  try {
    return { success: true, data: await tipoMensajeEmailRepository.cambiarEstado(codigo, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}
