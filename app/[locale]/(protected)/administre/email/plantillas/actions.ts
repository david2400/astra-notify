'use server';

import {
  actualizarPlantillaEmailAction,
  cambiarEstadoPlantillaEmailAction,
  crearPlantillaEmailAction,
  obtenerPlantillaEmailAction,
  previsualizarPlantillaEmailAction,
  type IActualizarPlantilla,
  type ICrearPlantilla,
  type IPrevisualizarPlantilla,
} from '@/server/domains/administre/email/plantillas';

export async function crearPlantillaEmailServerAction(payload: ICrearPlantilla) {
  return crearPlantillaEmailAction(payload);
}

export async function actualizarPlantillaEmailServerAction(payload: IActualizarPlantilla) {
  return actualizarPlantillaEmailAction(payload);
}

export async function cambiarEstadoPlantillaEmailServerAction(codigo: string, eliminado: boolean) {
  return cambiarEstadoPlantillaEmailAction(codigo, eliminado);
}

export async function obtenerPlantillaEmailServerAction(codigo: string) {
  return obtenerPlantillaEmailAction(codigo);
}

export async function previsualizarPlantillaEmailServerAction(payload: IPrevisualizarPlantilla) {
  return previsualizarPlantillaEmailAction(payload);
}
