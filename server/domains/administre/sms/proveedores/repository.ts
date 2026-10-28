import 'server-only';

import { smsAdminFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, type IEstadoPayload } from '../constants';
import { catalogoSms, cod, noEncontrado, type IProveedorApi } from '../notificacion';
import type { IActualizarProveedor, ICrearProveedor, IProveedor } from './types';

/** Proveedores de SMS en notificacion (/admin/sms/proveedores, por código). */
const BASE = '/proveedores';

export const aProveedor = (p: IProveedorApi): IProveedor => ({
  id: p.id,
  codigo: p.codigo,
  nombre: p.nombre,
  base_url: p.base_url,
  connect_timeout_ms: p.connect_timeout_ms,
  read_timeout_ms: p.read_timeout_ms,
  eliminado: p.eliminado,
  implementado: p.implementado,
  cuentas: p.cuentas ?? 0,
  servicios: p.servicios ?? [],
  fecha_creacion: p.created_at ?? null,
});

async function codigoDe(id: number): Promise<string> {
  return (await catalogoSms({ proveedores: true })).codigoProveedor(id);
}

export const proveedorRepository = {
  async list(): Promise<IProveedor[]> {
    return (await smsAdminFetch.get<IProveedorApi[]>(BASE, SIN_CACHE)).map(aProveedor);
  },

  async getById(id: number): Promise<IProveedor> {
    const p = (await proveedorRepository.list()).find((x) => x.id === id);
    if (!p) throw noEncontrado(`el proveedor ${id}`);
    return p;
  },

  /** Códigos de proveedor con módulo (sender) en sms_gateway, según la configuración de notificacion. */
  implementados(): Promise<string[]> {
    return smsAdminFetch.get<string[]>(`${BASE}/implementados`, SIN_CACHE);
  },

  async create(payload: ICrearProveedor): Promise<IProveedor> {
    return aProveedor(await smsAdminFetch.post<IProveedorApi>(BASE, payload));
  },

  /** El código no se puede cambiar (notificacion responde 400). */
  async update({ id, ...payload }: IActualizarProveedor): Promise<IProveedor> {
    return aProveedor(await smsAdminFetch.put<IProveedorApi>(`${BASE}/${cod(await codigoDe(id))}`, payload));
  },

  async cambiarEstado(id: number, payload: IEstadoPayload): Promise<IProveedor> {
    return aProveedor(await smsAdminFetch.patch<IProveedorApi>(`${BASE}/${cod(await codigoDe(id))}/estado`, payload));
  },
} as const;
