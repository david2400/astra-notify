'use server';

import {
  cancelarEnvioEmailAction,
  enviarPruebaEmailAction,
  obtenerDetalleEnvioEmailAction,
  obtenerLoteEmailAction,
  reintentarEnvioEmailAction,
  type IEnvioPrueba,
} from '@/server/domains/administre/email/envios';

export async function obtenerDetalleEnvioEmailServerAction(envioId: string) {
  return obtenerDetalleEnvioEmailAction(envioId);
}

export async function cancelarEnvioEmailServerAction(envioId: string) {
  return cancelarEnvioEmailAction(envioId);
}

export async function reintentarEnvioEmailServerAction(envioId: string) {
  return reintentarEnvioEmailAction(envioId);
}

export async function obtenerLoteEmailServerAction(loteId: string) {
  return obtenerLoteEmailAction(loteId);
}

export async function enviarPruebaEmailServerAction(payload: IEnvioPrueba) {
  return enviarPruebaEmailAction(payload);
}
