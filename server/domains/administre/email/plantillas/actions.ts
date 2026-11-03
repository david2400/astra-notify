'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { plantillaEmailRepository } from './repository';
import type {
  AccionFlujo,
  IActualizarPlantilla,
  ICrearPlantilla,
  IEnlaceVerificado,
  IFlujoPayload,
  IPlantilla,
  IPlantillaHistorial,
  IPlantillaPreview,
  IPlantillaVersion,
  IPrevisualizarPlantilla,
} from './types';

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

export async function versionesPlantillaEmailAction(codigo: string): Promise<ActionResult<IPlantillaVersion[]>> {
  try {
    return { success: true, data: await plantillaEmailRepository.versiones(codigo) };
  } catch (error) {
    return handleError(error);
  }
}

export async function versionPlantillaEmailAction(codigo: string, version: number): Promise<ActionResult<IPlantillaVersion>> {
  try {
    return { success: true, data: await plantillaEmailRepository.version(codigo, version) };
  } catch (error) {
    return handleError(error);
  }
}

export async function restaurarVersionPlantillaEmailAction(codigo: string, version: number, payload: IFlujoPayload): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaEmailRepository.restaurar(codigo, version, payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function historialPlantillaEmailAction(codigo: string): Promise<ActionResult<IPlantillaHistorial[]>> {
  try {
    return { success: true, data: await plantillaEmailRepository.historial(codigo) };
  } catch (error) {
    return handleError(error);
  }
}

export async function flujoPlantillaEmailAction(codigo: string, accion: AccionFlujo, payload: IFlujoPayload): Promise<ActionResult<IPlantilla>> {
  try {
    return { success: true, data: await plantillaEmailRepository.flujo(codigo, accion, payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function comentarPlantillaEmailAction(codigo: string, payload: IFlujoPayload): Promise<ActionResult<void>> {
  try {
    await plantillaEmailRepository.comentar(codigo, payload);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function verificarEnlacesEmailAction(urls: string[]): Promise<ActionResult<IEnlaceVerificado[]>> {
  try {
    return { success: true, data: await plantillaEmailRepository.verificarEnlaces(urls) };
  } catch (error) {
    return handleError(error);
  }
}
