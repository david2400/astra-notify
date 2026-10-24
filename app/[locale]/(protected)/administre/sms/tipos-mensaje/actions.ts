'use server';

import {
  actualizarTipoMensajeAction,
  cambiarEstadoTipoMensajeAction,
  crearTipoMensajeAction,
  eliminarTipoMensajeAction,
} from '@/server/domains/administre/sms/tipos-mensaje';
import type { IActualizarTipoMensaje, ICrearTipoMensaje } from '@/server/domains/administre/sms/tipos-mensaje';

export async function crearTipoMensajeServerAction(payload: ICrearTipoMensaje) {
  return crearTipoMensajeAction(payload);
}

export async function actualizarTipoMensajeServerAction(payload: IActualizarTipoMensaje) {
  return actualizarTipoMensajeAction(payload);
}

export async function eliminarTipoMensajeServerAction(id: number) {
  return eliminarTipoMensajeAction(id);
}

export async function cambiarEstadoTipoMensajeServerAction(id: number, eliminado: boolean) {
  return cambiarEstadoTipoMensajeAction(id, eliminado);
}
