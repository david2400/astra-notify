'use server';

import {
  actualizarCuentaAction,
  cambiarEstadoCuentaAction,
  crearCuentaAction,
} from '@/server/domains/administre/sms/cuentas';
import type { IActualizarCuenta, ICrearCuenta } from '@/server/domains/administre/sms/cuentas';

export async function crearCuentaServerAction(payload: ICrearCuenta) {
  return crearCuentaAction(payload);
}

export async function actualizarCuentaServerAction(payload: IActualizarCuenta) {
  return actualizarCuentaAction(payload);
}

export async function cambiarEstadoCuentaServerAction(id: number, eliminado: boolean) {
  return cambiarEstadoCuentaAction(id, eliminado);
}
