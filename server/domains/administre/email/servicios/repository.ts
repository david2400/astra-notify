import 'server-only';

import { emailAdminFetch } from '@/server/lib/server-fetch';
import { cod } from '../constants';
import type { IReemplazarServicios } from './types';

/** ServiciosResponse de notificacion. */
interface IServiciosApi {
  proveedor: string;
  tipos_mensaje: string[];
}

export const servicioEmailRepository = {
  /** Reemplaza la lista completa (notificacion: /admin/email/proveedores/{codigo}/servicios). Devuelve los códigos guardados. */
  async reemplazar({ proveedor, tipos_mensaje }: IReemplazarServicios): Promise<string[]> {
    const r = await emailAdminFetch.put<IServiciosApi>(`/proveedores/${cod(proveedor)}/servicios`, { tipos_mensaje });
    return r.tipos_mensaje ?? [];
  },
} as const;
