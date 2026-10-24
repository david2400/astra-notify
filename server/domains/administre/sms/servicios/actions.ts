'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { servicioRepository } from './repository';
import type { IReemplazarServicios, IServiciosProveedor } from './types';

export async function reemplazarServiciosAction(
  payload: IReemplazarServicios,
): Promise<ActionResult<IServiciosProveedor>> {
  try {
    return { success: true, data: await servicioRepository.reemplazar(payload) };
  } catch (error) {
    return handleError(error);
  }
}
