'use server';

import { handleError } from '@/server/lib/handlers';
import { emailGatewayFetch } from '@/server/lib/server-fetch';
import type { ActionResult } from '@/server/lib/types/action.type';
import { EMAIL_ADMIN } from '../constants';

/**
 * Descarta las cachés del motor (rutas, cuentas, servicios y plantillas) en el nodo que atiende la
 * llamada. Los cambios hechos desde esta administración ya las invalidan; sirve tras cambios en BD.
 */
export async function refrescarCacheEmailAction(): Promise<ActionResult> {
  try {
    await Promise.all([
      emailGatewayFetch.post<void>(`${EMAIL_ADMIN}/rutas/cache/refresh`),
      emailGatewayFetch.post<void>(`${EMAIL_ADMIN}/plantillas/cache/refresh`),
    ]);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
