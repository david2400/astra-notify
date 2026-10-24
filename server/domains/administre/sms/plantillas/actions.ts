'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { plantillaRepository } from './repository';
import type {
  IActualizarPlantilla,
  ICrearPlantilla,
  IPlantilla,
  IPlantillaPreview,
  IPrevisualizarPlantilla,
} from './types';

export async function crearPlantillaAction(payload: ICrearPlantilla): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarPlantillaAction(payload: IActualizarPlantilla): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaRepository.update(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoPlantillaAction(
  id: number,
  eliminado: boolean,
): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaRepository.cambiarEstado(id, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}

export async function previsualizarPlantillaAction(
  payload: IPrevisualizarPlantilla,
): Promise<ActionResult<IPlantillaPreview>> {
  try {
    return { success: true, data: await plantillaRepository.previsualizar(payload) };
  } catch (error) {
    return handleError(error);
  }
}
