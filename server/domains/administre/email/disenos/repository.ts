import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import { EMAIL_ADMIN, SIN_CACHE, type IEstadoPayload } from '../constants';
import type { IComponente, IGuardarComponente, IGuardarMarca, IMarca } from './types';

const COMPONENTES = `${EMAIL_ADMIN}/componentes`;
const MARCA = `${EMAIL_ADMIN}/marca`;

export const disenoEmailRepository = {
  /** Componentes activos de la biblioteca (con su contenido: se arrastran tal cual al editor). */
  componentes(incluirInactivos = false): Promise<IComponente[]> {
    return emailGatewayFetch.get<IComponente[]>(COMPONENTES, { ...SIN_CACHE, params: incluirInactivos ? { incluir_inactivos: true } : undefined });
  },

  crearComponente(payload: IGuardarComponente): Promise<IComponente> {
    return emailGatewayFetch.post<IComponente>(COMPONENTES, payload);
  },

  actualizarComponente(id: number, payload: IGuardarComponente): Promise<IComponente> {
    return emailGatewayFetch.put<IComponente>(`${COMPONENTES}/${id}`, payload);
  },

  estadoComponente(id: number, payload: IEstadoPayload): Promise<IComponente> {
    return emailGatewayFetch.patch<IComponente>(`${COMPONENTES}/${id}/estado`, payload);
  },

  marca(): Promise<IMarca> {
    return emailGatewayFetch.get<IMarca>(MARCA, SIN_CACHE);
  },

  guardarMarca(payload: IGuardarMarca): Promise<IMarca> {
    return emailGatewayFetch.put<IMarca>(MARCA, payload);
  },
} as const;
