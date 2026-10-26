'use server';

import {
  cambiarEstadoRutaEmailAction,
  crearRutaEmailAction,
  obtenerRutaEfectivaEmailAction,
  reemplazarPasosEmailAction,
  type ICrearRuta,
  type IFiltroRutaEfectiva,
  type IReemplazarPasos,
} from '@/server/domains/administre/email/rutas';

export async function crearRutaEmailServerAction(payload: ICrearRuta) {
  return crearRutaEmailAction(payload);
}

export async function reemplazarPasosEmailServerAction(payload: IReemplazarPasos) {
  return reemplazarPasosEmailAction(payload);
}

export async function cambiarEstadoRutaEmailServerAction(id: number, eliminado: boolean) {
  return cambiarEstadoRutaEmailAction(id, eliminado);
}

export async function obtenerRutaEfectivaEmailServerAction(filtro: IFiltroRutaEfectiva) {
  return obtenerRutaEfectivaEmailAction(filtro);
}
