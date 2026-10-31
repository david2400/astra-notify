'use server';

import {
  cambiarCodigoRutaAction,
  cambiarEstadoRutaAction,
  crearRutaAction,
  eliminarRutaAction,
  obtenerRutaEfectivaAction,
  reemplazarPasosAction,
} from '@/server/domains/administre/sms/rutas';
import type { ICrearRuta, IFiltroRutaEfectiva, IReemplazarPasos } from '@/server/domains/administre/sms/rutas';

export async function crearRutaServerAction(payload: ICrearRuta) {
  return crearRutaAction(payload);
}

export async function reemplazarPasosServerAction(payload: IReemplazarPasos) {
  return reemplazarPasosAction(payload);
}

export async function eliminarRutaServerAction(id: number) {
  return eliminarRutaAction(id);
}

export async function cambiarEstadoRutaServerAction(id: number, eliminado: boolean) {
  return cambiarEstadoRutaAction(id, eliminado);
}

export async function obtenerRutaEfectivaServerAction(filtro: IFiltroRutaEfectiva) {
  return obtenerRutaEfectivaAction(filtro);
}

export async function cambiarCodigoRutaServerAction(id: number, codigo: string | null) {
  return cambiarCodigoRutaAction(id, codigo);
}
