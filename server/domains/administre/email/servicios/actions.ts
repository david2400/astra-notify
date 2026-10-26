'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { servicioEmailRepository } from './repository';
import type { IReemplazarServicios } from './types';

export async function reemplazarServiciosEmailAction(payload: IReemplazarServicios): Promise<ActionResult<string[]>> {
  try {
    return { success: true, data: await servicioEmailRepository.reemplazar(payload) };
  } catch (error) {
    return handleError(error);
  }
}
