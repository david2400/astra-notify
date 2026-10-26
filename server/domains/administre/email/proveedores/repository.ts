import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import { cod, EMAIL_ADMIN, SIN_CACHE, type IEstadoPayload } from '../constants';
import type { IActualizarProveedor, ICrearProveedor, IProveedor } from './types';

const BASE = `${EMAIL_ADMIN}/proveedores`;

export const proveedorEmailRepository = {
  list(): Promise<IProveedor[]> {
    return emailGatewayFetch.get<IProveedor[]>(BASE, SIN_CACHE);
  },

  /** Códigos con implementación en email_gateway (GMAIL, BREVO, MOCK). */
  implementados(): Promise<string[]> {
    return emailGatewayFetch.get<string[]>(`${BASE}/implementados`, SIN_CACHE);
  },

  create(payload: ICrearProveedor): Promise<IProveedor> {
    return emailGatewayFetch.post<IProveedor>(BASE, payload);
  },

  update(payload: IActualizarProveedor): Promise<IProveedor> {
    return emailGatewayFetch.put<IProveedor>(`${BASE}/${cod(payload.codigo)}`, payload);
  },

  cambiarEstado(codigo: string, payload: IEstadoPayload): Promise<IProveedor> {
    return emailGatewayFetch.patch<IProveedor>(`${BASE}/${cod(codigo)}/estado`, payload);
  },
} as const;
