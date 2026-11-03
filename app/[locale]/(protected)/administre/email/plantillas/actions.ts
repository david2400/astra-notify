'use server';

import {
  actualizarPlantillaEmailAction,
  cambiarEstadoPlantillaEmailAction,
  crearPlantillaEmailAction,
  obtenerPlantillaEmailAction,
  previsualizarPlantillaEmailAction,
  versionesPlantillaEmailAction,
  versionPlantillaEmailAction,
  restaurarVersionPlantillaEmailAction,
  historialPlantillaEmailAction,
  flujoPlantillaEmailAction,
  comentarPlantillaEmailAction,
  verificarEnlacesEmailAction,
  type AccionFlujo,
  type IFlujoPayload,
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

/* ---------- Versiones y flujo de aprobación ---------- */

export async function versionesPlantillaEmailServerAction(codigo: string) {
  return versionesPlantillaEmailAction(codigo);
}

export async function versionPlantillaEmailServerAction(codigo: string, version: number) {
  return versionPlantillaEmailAction(codigo, version);
}

export async function restaurarVersionPlantillaEmailServerAction(codigo: string, version: number, payload: IFlujoPayload) {
  return restaurarVersionPlantillaEmailAction(codigo, version, payload);
}

export async function historialPlantillaEmailServerAction(codigo: string) {
  return historialPlantillaEmailAction(codigo);
}

export async function flujoPlantillaEmailServerAction(codigo: string, accion: AccionFlujo, payload: IFlujoPayload) {
  return flujoPlantillaEmailAction(codigo, accion, payload);
}

export async function comentarPlantillaEmailServerAction(codigo: string, payload: IFlujoPayload) {
  return comentarPlantillaEmailAction(codigo, payload);
}

/* ---------- Calidad ---------- */

export async function verificarEnlacesEmailServerAction(urls: string[]) {
  return verificarEnlacesEmailAction(urls);
}
