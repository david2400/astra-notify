'use server';

import { reemplazarServiciosAction } from '@/server/domains/administre/sms/servicios';
import type { IReemplazarServicios } from '@/server/domains/administre/sms/servicios';

export async function reemplazarServiciosServerAction(payload: IReemplazarServicios) {
  return reemplazarServiciosAction(payload);
}
