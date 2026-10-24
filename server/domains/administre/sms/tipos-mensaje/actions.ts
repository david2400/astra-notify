'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { tipoMensajeRepository } from './repository';
import type { IActualizarTipoMensaje, ICrearTipoMensaje, ITipoMensaje } from './types';

export async function crearTipoMensajeAction(payload: ICrearTipoMensaje): Promise<ActionResult<ITipoMensaje>> {
  try {
    return { success: true, data: await tipoMensajeRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarTipoMensajeAction(
  payload: IActualizarTipoMensaje,
): Promise<ActionResult<ITipoMensaje>> {
  try {
    return { success: true, data: await tipoMensajeRepository.update(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function eliminarTipoMensajeAction(id: number): Promise<ActionResult> {
  try {
    await tipoMensajeRepository.delete(id);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoTipoMensajeAction(
  id: number,
  eliminado: boolean,
): Promise<ActionResult<ITipoMensaje>> {
  try {
    return { success: true, data: await tipoMensajeRepository.cambiarEstado(id, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}
