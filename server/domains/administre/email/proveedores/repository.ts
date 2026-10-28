import 'server-only';

import { emailAdminFetch } from '@/server/lib/server-fetch';
import { cod, SIN_CACHE, type IEstadoPayload } from '../constants';
import type { IActualizarProveedor, ICrearProveedor, IProveedor } from './types';

/** notificacion: /api/notificacion/v1/admin/email/proveedores (por código). */
const BASE = '/proveedores';

export const proveedorEmailRepository = {
  list(): Promise<IProveedor[]> {
    return emailAdminFetch.get<IProveedor[]>(BASE, SIN_CACHE);
  },

  /** Códigos con implementación (sender) en email_gateway, según la configuración de notificacion. */
  implementados(): Promise<string[]> {
    return emailAdminFetch.get<string[]>(`${BASE}/implementados`, SIN_CACHE);
  },

  create(payload: ICrearProveedor): Promise<IProveedor> {
    return emailAdminFetch.post<IProveedor>(BASE, payload);
  },

  update(payload: IActualizarProveedor): Promise<IProveedor> {
    return emailAdminFetch.put<IProveedor>(`${BASE}/${cod(payload.codigo)}`, payload);
  },

  cambiarEstado(codigo: string, payload: IEstadoPayload): Promise<IProveedor> {
    return emailAdminFetch.patch<IProveedor>(`${BASE}/${cod(codigo)}/estado`, payload);
  },
} as const;
