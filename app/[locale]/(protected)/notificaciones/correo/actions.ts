'use server';

import {
  enviarEmailAction,
  enviarEmailLoteAction,
  type IEnviarEmail,
  type IEnviarEmailLote,
} from '@/server/domains/notificaciones/email';
import {
  obtenerPlantillaEmailAction,
  previsualizarPlantillaEmailAction,
  type IPrevisualizarPlantilla,
} from '@/server/domains/administre/email/plantillas';

export async function enviarEmailServerAction(payload: IEnviarEmail) {
  return enviarEmailAction(payload);
}

export async function enviarEmailLoteServerAction(payload: IEnviarEmailLote) {
  return enviarEmailLoteAction(payload);
}

/** Detalle de la plantilla (incluye variables; el listado no las trae). */
export async function obtenerPlantillaCorreoServerAction(codigo: string) {
  return obtenerPlantillaEmailAction(codigo);
}

export async function previsualizarPlantillaCorreoServerAction(payload: IPrevisualizarPlantilla) {
  return previsualizarPlantillaEmailAction(payload);
}
