'use server';

import {
  actualizarPlantillaAction,
  cambiarEstadoPlantillaAction,
  crearPlantillaAction,
  previsualizarPlantillaAction,
} from '@/server/domains/administre/sms/plantillas';
import type {
  IActualizarPlantilla,
  ICrearPlantilla,
  IPrevisualizarPlantilla,
} from '@/server/domains/administre/sms/plantillas';

export async function crearPlantillaServerAction(payload: ICrearPlantilla) {
  return crearPlantillaAction(payload);
}

export async function actualizarPlantillaServerAction(payload: IActualizarPlantilla) {
  return actualizarPlantillaAction(payload);
}

export async function cambiarEstadoPlantillaServerAction(id: number, eliminado: boolean) {
  return cambiarEstadoPlantillaAction(id, eliminado);
}

export async function previsualizarPlantillaServerAction(payload: IPrevisualizarPlantilla) {
  return previsualizarPlantillaAction(payload);
}
