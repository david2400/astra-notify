'use server';

import { obtenerEnvioSmsAction } from '@/server/domains/notificaciones/sms';

export async function obtenerEnvioSmsServerAction(envioId: string) {
  return obtenerEnvioSmsAction(envioId);
}
