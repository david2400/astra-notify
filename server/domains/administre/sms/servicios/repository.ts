import 'server-only';

import { smsGatewayFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, SMS_ADMIN } from '../constants';
import type { IReemplazarServicios, IServiciosProveedor } from './types';

const ruta = (proveedorId: number) => `${SMS_ADMIN}/proveedores/${proveedorId}/servicios`;

export const servicioRepository = {
  get(proveedorId: number): Promise<IServiciosProveedor> {
    return smsGatewayFetch.get<IServiciosProveedor>(ruta(proveedorId), SIN_CACHE);
  },

  /** Reemplaza la lista completa (responde 409 si se quita un tipo que usan rutas del proveedor). */
  reemplazar({ proveedor_id, tipos_mensaje }: IReemplazarServicios): Promise<IServiciosProveedor> {
    return smsGatewayFetch.put<IServiciosProveedor>(ruta(proveedor_id), { tipos_mensaje });
  },
} as const;
