import 'server-only';

import { smsAdminFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE } from '../constants';
import { catalogoSms, cod, type IServiciosApi } from '../notificacion';
import type { IReemplazarServicios, IServiciosProveedor } from './types';

/** Servicios (tipos de mensaje) de un proveedor de SMS en notificacion: /admin/sms/proveedores/{codigo}/servicios. */
const ruta = (proveedor: string) => `/proveedores/${cod(proveedor)}/servicios`;

const aServicios = (proveedorId: number, s: IServiciosApi): IServiciosProveedor => ({
  proveedor_id: proveedorId,
  proveedor_codigo: s.proveedor,
  tipos_mensaje: s.tipos_mensaje ?? [],
});

export const servicioRepository = {
  async get(proveedorId: number): Promise<IServiciosProveedor> {
    const proveedor = (await catalogoSms({ proveedores: true })).codigoProveedor(proveedorId);
    return aServicios(proveedorId, await smsAdminFetch.get<IServiciosApi>(ruta(proveedor), SIN_CACHE));
  },

  /** Reemplaza la lista completa (409 si se quita un tipo que usan rutas con cuentas del proveedor). */
  async reemplazar({ proveedor_id, tipos_mensaje }: IReemplazarServicios): Promise<IServiciosProveedor> {
    const proveedor = (await catalogoSms({ proveedores: true })).codigoProveedor(proveedor_id);
    return aServicios(proveedor_id, await smsAdminFetch.put<IServiciosApi>(ruta(proveedor), { tipos_mensaje }));
  },
} as const;
