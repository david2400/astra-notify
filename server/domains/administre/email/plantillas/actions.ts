'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { plantillaEmailRepository } from './repository';
import type { IActualizarPlantilla, ICrearPlantilla, IPlantilla, IPlantillaPreview, IPrevisualizarPlantilla } from './types';

export async function crearPlantillaEmailAction(payload: ICrearPlantilla): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaEmailRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarPlantillaEmailAction(payload: IActualizarPlantilla): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaEmailRepository.update(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoPlantillaEmailAction(codigo: string, eliminado: boolean): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaEmailRepository.cambiarEstado(codigo, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}

export async function obtenerPlantillaEmailAction(codigo: string): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaEmailRepository.get(codigo) };
  } catch (error) {
    return handleError(error);
  }
}

export async function previsualizarPlantillaEmailAction(payload: IPrevisualizarPlantilla): Promise<ActionResult<IPlantillaPreview>> {
  try {
    return { success: true, data: await plantillaEmailRepository.previsualizar(payload) };
  } catch (error) {
    return handleError(error);
  }
}
