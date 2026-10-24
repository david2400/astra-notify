import 'server-only';

import { smsGatewayFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, SMS_ADMIN, type IEstadoPayload } from '../constants';
import type { IActualizarProveedor, ICrearProveedor, IProveedor } from './types';

const BASE = `${SMS_ADMIN}/proveedores`;

export const proveedorRepository = {
  list(): Promise<IProveedor[]> {
    return smsGatewayFetch.get<IProveedor[]>(BASE, SIN_CACHE);
  },

  getById(id: number): Promise<IProveedor> {
    return smsGatewayFetch.get<IProveedor>(`${BASE}/${id}`, SIN_CACHE);
  },

  /** Códigos de proveedor que tienen módulo implementado en sms_gateway. */
  implementados(): Promise<string[]> {
    return smsGatewayFetch.get<string[]>(`${BASE}/implementados`, SIN_CACHE);
  },

  create(payload: ICrearProveedor): Promise<IProveedor> {
    return smsGatewayFetch.post<IProveedor>(BASE, payload);
  },

  update({ id, ...payload }: IActualizarProveedor): Promise<IProveedor> {
    return smsGatewayFetch.put<IProveedor>(`${BASE}/${id}`, payload);
  },

  cambiarEstado(id: number, payload: IEstadoPayload): Promise<IProveedor> {
    return smsGatewayFetch.patch<IProveedor>(`${BASE}/${id}/estado`, payload);
  },
} as const;
