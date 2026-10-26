import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import { cod, EMAIL_ADMIN, SIN_CACHE, type IEstadoPayload } from '../constants';
import type { IActualizarTipoMensaje, ICrearTipoMensaje, ITipoMensaje } from './types';

const BASE = `${EMAIL_ADMIN}/tipos-mensaje`;

export const tipoMensajeEmailRepository = {
  list(): Promise<ITipoMensaje[]> {
    return emailGatewayFetch.get<ITipoMensaje[]>(BASE, SIN_CACHE);
  },

  create(payload: ICrearTipoMensaje): Promise<ITipoMensaje> {
    return emailGatewayFetch.post<ITipoMensaje>(BASE, payload);
  },

  update(payload: IActualizarTipoMensaje): Promise<ITipoMensaje> {
    return emailGatewayFetch.put<ITipoMensaje>(`${BASE}/${cod(payload.codigo)}`, payload);
  },

  cambiarEstado(codigo: string, payload: IEstadoPayload): Promise<ITipoMensaje> {
    return emailGatewayFetch.patch<ITipoMensaje>(`${BASE}/${cod(codigo)}/estado`, payload);
  },
} as const;
