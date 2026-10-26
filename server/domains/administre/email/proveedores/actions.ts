'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { proveedorEmailRepository } from './repository';
import type { IActualizarProveedor, ICrearProveedor, IProveedor } from './types';

export async function crearProveedorEmailAction(payload: ICrearProveedor): Promise<ActionResult<IProveedor>> {
  try {
    return { success: true, data: await proveedorEmailRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarProveedorEmailAction(payload: IActualizarProveedor): Promise<ActionResult<IProveedor>> {
  try {
    return { success: true, data: await proveedorEmailRepository.update(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoProveedorEmailAction(codigo: string, eliminado: boolean): Promise<ActionResult<IProveedor>> {
  try {
    return { success: true, data: await proveedorEmailRepository.cambiarEstado(codigo, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}
