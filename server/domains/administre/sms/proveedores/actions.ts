'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { proveedorRepository } from './repository';
import type { IActualizarProveedor, ICrearProveedor, IProveedor } from './types';

export async function crearProveedorAction(payload: ICrearProveedor): Promise<ActionResult<IProveedor>> {
  try {
    return { success: true, data: await proveedorRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarProveedorAction(payload: IActualizarProveedor): Promise<ActionResult<IProveedor>> {
  try {
    return { success: true, data: await proveedorRepository.update(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoProveedorAction(id: number, eliminado: boolean): Promise<ActionResult<IProveedor>> {
  try {
    return { success: true, data: await proveedorRepository.cambiarEstado(id, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}
