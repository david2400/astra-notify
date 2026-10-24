'use server';

import {
  actualizarProveedorAction,
  cambiarEstadoProveedorAction,
  crearProveedorAction,
} from '@/server/domains/administre/sms/proveedores';
import type { IActualizarProveedor, ICrearProveedor } from '@/server/domains/administre/sms/proveedores';

export async function crearProveedorServerAction(payload: ICrearProveedor) {
  return crearProveedorAction(payload);
}

export async function actualizarProveedorServerAction(payload: IActualizarProveedor) {
  return actualizarProveedorAction(payload);
}

export async function cambiarEstadoProveedorServerAction(id: number, eliminado: boolean) {
  return cambiarEstadoProveedorAction(id, eliminado);
}
