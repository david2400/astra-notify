'use server';

import { handleError } from '@/server/lib/handlers';
import { smsAdminFetch } from '@/server/lib/server-fetch';
import type { ActionResult } from '@/server/lib/types/action.type';

/**
 * La configuración se guarda en notificacion; sms_gateway la toma al vencer su caché de rutas
 * (routing-cache-ttl-seconds, 60 s por defecto). notificacion responde 204 sin avisar al gateway.
 */
export async function refrescarCacheRutasAction(): Promise<ActionResult> {
  try {
    await smsAdminFetch.post<void>('/cache/refresh');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
