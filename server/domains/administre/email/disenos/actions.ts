'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { disenoEmailRepository } from './repository';
import type { IComponente, IGuardarComponente, IGuardarMarca, IMarca } from './types';

export async function listarComponentesEmailAction(incluirInactivos = false): Promise<ActionResult<IComponente[]>> {
  try {
    return { success: true, data: await disenoEmailRepository.componentes(incluirInactivos) };
  } catch (error) {
    return handleError(error);
  }
}

export async function crearComponenteEmailAction(payload: IGuardarComponente): Promise<ActionResult<IComponente>> {
  try {
    return { success: true, data: await disenoEmailRepository.crearComponente(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarComponenteEmailAction(id: number, payload: IGuardarComponente): Promise<ActionResult<IComponente>> {
  try {
    return { success: true, data: await disenoEmailRepository.actualizarComponente(id, payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function archivarComponenteEmailAction(id: number, eliminado: boolean): Promise<ActionResult<IComponente>> {
  try {
    return { success: true, data: await disenoEmailRepository.estadoComponente(id, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}

export async function guardarMarcaEmailAction(payload: IGuardarMarca): Promise<ActionResult<IMarca>> {
  try {
    return { success: true, data: await disenoEmailRepository.guardarMarca(payload) };
  } catch (error) {
    return handleError(error);
  }
}
