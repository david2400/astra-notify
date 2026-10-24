'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { rutaRepository } from './repository';
import type { ICrearRuta, IFiltroRutaEfectiva, IReemplazarPasos, IRuta, IRutaEfectiva } from './types';

export async function crearRutaAction(payload: ICrearRuta): Promise<ActionResult<IRuta>> {
  try {
    return { success: true, data: await rutaRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function reemplazarPasosAction(payload: IReemplazarPasos): Promise<ActionResult<IRuta>> {
  try {
    return { success: true, data: await rutaRepository.reemplazarPasos(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function eliminarRutaAction(id: number): Promise<ActionResult> {
  try {
    await rutaRepository.delete(id);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoRutaAction(id: number, eliminado: boolean): Promise<ActionResult<IRuta>> {
  try {
    return { success: true, data: await rutaRepository.cambiarEstado(id, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}

export async function obtenerRutaEfectivaAction(filtro: IFiltroRutaEfectiva): Promise<ActionResult<IRutaEfectiva>> {
  try {
    return { success: true, data: await rutaRepository.efectiva(filtro) };
  } catch (error) {
    return handleError(error);
  }
}
