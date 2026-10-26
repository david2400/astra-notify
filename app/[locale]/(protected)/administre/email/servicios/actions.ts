'use server';

import { reemplazarServiciosEmailAction, type IReemplazarServicios } from '@/server/domains/administre/email/servicios';

export async function reemplazarServiciosEmailServerAction(payload: IReemplazarServicios) {
  return reemplazarServiciosEmailAction(payload);
}
