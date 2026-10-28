'use server';

import { handleError } from '@/server/lib/handlers';
import { emailAdminFetch, emailGatewayFetch } from '@/server/lib/server-fetch';
import type { ActionResult } from '@/server/lib/types/action.type';
import { EMAIL_ADMIN } from '../constants';

/**
 * Plantillas: descarta la caché de email_gateway en el nodo que atiende la llamada.
 * Rutas, cuentas y servicios se guardan en notificacion; email_gateway los toma al vencer su caché
 * (notificacion responde 204 sin avisar al gateway).
 */
export async function refrescarCacheEmailAction(): Promise<ActionResult> {
  try {
    await Promise.all([
      emailAdminFetch.post<void>('/cache/refresh'),
      emailGatewayFetch.post<void>(`${EMAIL_ADMIN}/plantillas/cache/refresh`),
    ]);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
