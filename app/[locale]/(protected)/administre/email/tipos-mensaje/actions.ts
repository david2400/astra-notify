'use server';

import {
  actualizarTipoMensajeEmailAction,
  cambiarEstadoTipoMensajeEmailAction,
  crearTipoMensajeEmailAction,
  type IActualizarTipoMensaje,
  type ICrearTipoMensaje,
} from '@/server/domains/administre/email/tipos-mensaje';

export async function crearTipoMensajeEmailServerAction(payload: ICrearTipoMensaje) {
  return crearTipoMensajeEmailAction(payload);
}

export async function actualizarTipoMensajeEmailServerAction(payload: IActualizarTipoMensaje) {
  return actualizarTipoMensajeEmailAction(payload);
}

export async function cambiarEstadoTipoMensajeEmailServerAction(codigo: string, eliminado: boolean) {
  return cambiarEstadoTipoMensajeEmailAction(codigo, eliminado);
}
