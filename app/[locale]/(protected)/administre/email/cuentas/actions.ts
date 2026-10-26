'use server';

import {
  actualizarCuentaEmailAction,
  cambiarEstadoCuentaEmailAction,
  crearCuentaEmailAction,
  probarCuentaEmailAction,
  type IActualizarCuenta,
  type ICrearCuenta,
} from '@/server/domains/administre/email/cuentas';

export async function crearCuentaEmailServerAction(payload: ICrearCuenta) {
  return crearCuentaEmailAction(payload);
}

export async function actualizarCuentaEmailServerAction(payload: IActualizarCuenta) {
  return actualizarCuentaEmailAction(payload);
}

export async function cambiarEstadoCuentaEmailServerAction(codigo: string, eliminado: boolean) {
  return cambiarEstadoCuentaEmailAction(codigo, eliminado);
}

export async function probarCuentaEmailServerAction(codigo: string) {
  return probarCuentaEmailAction(codigo);
}
