'use server';

import { handleError } from '@/server/lib/handlers';
import { smsGatewayFetch } from '@/server/lib/server-fetch';
import type { ActionResult } from '@/server/lib/types/action.type';
import { SMS_ADMIN } from '../constants';

/**
 * Descarta la caché de rutas y servicios del motor. Los cambios hechos desde esta administración
 * ya la invalidan; sirve tras cambios directos en BD.
 */
export async function refrescarCacheRutasAction(): Promise<ActionResult> {
  try {
    await smsGatewayFetch.post<void>(`${SMS_ADMIN}/routing-cache/refresh`);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
