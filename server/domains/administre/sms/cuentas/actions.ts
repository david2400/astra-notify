'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { cuentaRepository } from './repository';
import type { IActualizarCuenta, ICrearCuenta, ICuenta } from './types';

export async function crearCuentaAction(payload: ICrearCuenta): Promise<ActionResult<ICuenta>> {
  try {
    return { success: true, data: await cuentaRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarCuentaAction(payload: IActualizarCuenta): Promise<ActionResult<ICuenta>> {
  try {
    return { success: true, data: await cuentaRepository.update(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoCuentaAction(id: number, eliminado: boolean): Promise<ActionResult<ICuenta>> {
  try {
    return { success: true, data: await cuentaRepository.cambiarEstado(id, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}
