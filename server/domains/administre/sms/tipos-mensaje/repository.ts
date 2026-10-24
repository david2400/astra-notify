import 'server-only';

import { smsGatewayFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, SMS_ADMIN, type IEstadoPayload } from '../constants';
import type { IActualizarTipoMensaje, ICrearTipoMensaje, IFiltroTiposMensaje, ITipoMensaje } from './types';

const BASE = `${SMS_ADMIN}/tipos-mensaje`;

export const tipoMensajeRepository = {
  list(filtro: IFiltroTiposMensaje = {}): Promise<ITipoMensaje[]> {
    return smsGatewayFetch.get<ITipoMensaje[]>(BASE, { ...SIN_CACHE, params: { ...filtro } });
  },

  create(payload: ICrearTipoMensaje): Promise<ITipoMensaje> {
    return smsGatewayFetch.post<ITipoMensaje>(BASE, payload);
  },

  update({ id, ...payload }: IActualizarTipoMensaje): Promise<ITipoMensaje> {
    return smsGatewayFetch.put<ITipoMensaje>(`${BASE}/${id}`, payload);
  },

  delete(id: number): Promise<void> {
    return smsGatewayFetch.delete<void>(`${BASE}/${id}`);
  },

  cambiarEstado(id: number, payload: IEstadoPayload): Promise<ITipoMensaje> {
    return smsGatewayFetch.patch<ITipoMensaje>(`${BASE}/${id}/estado`, payload);
  },
} as const;
