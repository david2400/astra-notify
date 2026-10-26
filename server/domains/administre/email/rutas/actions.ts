'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { rutaEmailRepository } from './repository';
import type { ICrearRuta, IFiltroRutaEfectiva, IReemplazarPasos, IRuta, IRutaEfectiva } from './types';

export async function crearRutaEmailAction(payload: ICrearRuta): Promise<ActionResult<IRuta>> {
  try {
    return { success: true, data: await rutaEmailRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function reemplazarPasosEmailAction(payload: IReemplazarPasos): Promise<ActionResult<IRuta>> {
  try {
    return { success: true, data: await rutaEmailRepository.reemplazarPasos(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoRutaEmailAction(id: number, eliminado: boolean): Promise<ActionResult<IRuta>> {
  try {
    return { success: true, data: await rutaEmailRepository.cambiarEstado(id, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}

export async function obtenerRutaEfectivaEmailAction(filtro: IFiltroRutaEfectiva): Promise<ActionResult<IRutaEfectiva>> {
  try {
    return { success: true, data: await rutaEmailRepository.efectiva(filtro) };
  } catch (error) {
    return handleError(error);
  }
}
