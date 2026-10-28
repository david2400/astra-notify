import 'server-only';

import { emailAdminFetch } from '@/server/lib/server-fetch';
import { cod, SIN_CACHE, type IEstadoPayload } from '../constants';
import type { IActualizarTipoMensaje, ICrearTipoMensaje, ITipoMensaje } from './types';

/** notificacion: /api/notificacion/v1/admin/email/tipos-mensaje (por código). */
const BASE = '/tipos-mensaje';

export const tipoMensajeEmailRepository = {
  list(): Promise<ITipoMensaje[]> {
    return emailAdminFetch.get<ITipoMensaje[]>(BASE, SIN_CACHE);
  },

  create(payload: ICrearTipoMensaje): Promise<ITipoMensaje> {
    return emailAdminFetch.post<ITipoMensaje>(BASE, payload);
  },

  update(payload: IActualizarTipoMensaje): Promise<ITipoMensaje> {
    return emailAdminFetch.put<ITipoMensaje>(`${BASE}/${cod(payload.codigo)}`, payload);
  },

  cambiarEstado(codigo: string, payload: IEstadoPayload): Promise<ITipoMensaje> {
    return emailAdminFetch.patch<ITipoMensaje>(`${BASE}/${cod(codigo)}/estado`, payload);
  },
} as const;
