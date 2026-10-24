import 'server-only';

import { smsGatewayFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, SMS_ADMIN, type IEstadoPayload } from '../constants';
import type {
  ICrearRuta,
  IFiltroRutaEfectiva,
  IFiltroRutas,
  IReemplazarPasos,
  IRuta,
  IRutaEfectiva,
} from './types';

const BASE = `${SMS_ADMIN}/rutas`;

export const rutaRepository = {
  list(filtro: IFiltroRutas = {}): Promise<IRuta[]> {
    return smsGatewayFetch.get<IRuta[]>(BASE, { ...SIN_CACHE, params: { ...filtro } });
  },

  create(payload: ICrearRuta): Promise<IRuta> {
    return smsGatewayFetch.post<IRuta>(BASE, payload);
  },

  reemplazarPasos({ ruta_id, pasos }: IReemplazarPasos): Promise<IRuta> {
    return smsGatewayFetch.put<IRuta>(`${BASE}/${ruta_id}/pasos`, { pasos });
  },

  delete(id: number): Promise<void> {
    return smsGatewayFetch.delete<void>(`${BASE}/${id}`);
  },

  cambiarEstado(id: number, payload: IEstadoPayload): Promise<IRuta> {
    return smsGatewayFetch.patch<IRuta>(`${BASE}/${id}/estado`, payload);
  },

  /** La ruta tal como la usará el motor, con advertencias (cuentas sin credenciales, etc.). */
  efectiva(filtro: IFiltroRutaEfectiva): Promise<IRutaEfectiva> {
    return smsGatewayFetch.get<IRutaEfectiva>(`${BASE}/efectiva`, { ...SIN_CACHE, params: { ...filtro } });
  },
} as const;
