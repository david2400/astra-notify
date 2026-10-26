'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { cuentaEmailRepository } from './repository';
import type { IActualizarCuenta, ICrearCuenta, ICuenta, IVerificacionCuenta } from './types';

export async function crearCuentaEmailAction(payload: ICrearCuenta): Promise<ActionResult<ICuenta>> {
  try {
    return { success: true, data: await cuentaEmailRepository.create(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function actualizarCuentaEmailAction(payload: IActualizarCuenta): Promise<ActionResult<ICuenta>> {
  try {
    return { success: true, data: await cuentaEmailRepository.update(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function cambiarEstadoCuentaEmailAction(codigo: string, eliminado: boolean): Promise<ActionResult<ICuenta>> {
  try {
    return { success: true, data: await cuentaEmailRepository.cambiarEstado(codigo, { eliminado }) };
  } catch (error) {
    return handleError(error);
  }
}

export async function probarCuentaEmailAction(codigo: string): Promise<ActionResult<IVerificacionCuenta>> {
  try {
    return { success: true, data: await cuentaEmailRepository.probar(codigo) };
  } catch (error) {
    return handleError(error);
  }
}
