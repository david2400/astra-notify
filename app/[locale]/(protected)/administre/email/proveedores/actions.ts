'use server';

import {
  actualizarProveedorEmailAction,
  cambiarEstadoProveedorEmailAction,
  crearProveedorEmailAction,
  type IActualizarProveedor,
  type ICrearProveedor,
} from '@/server/domains/administre/email/proveedores';

export async function crearProveedorEmailServerAction(payload: ICrearProveedor) {
  return crearProveedorEmailAction(payload);
}

export async function actualizarProveedorEmailServerAction(payload: IActualizarProveedor) {
  return actualizarProveedorEmailAction(payload);
}

export async function cambiarEstadoProveedorEmailServerAction(codigo: string, eliminado: boolean) {
  return cambiarEstadoProveedorEmailAction(codigo, eliminado);
}
