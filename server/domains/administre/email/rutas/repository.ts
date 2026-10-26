import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import { EMAIL_ADMIN, SIN_CACHE, type IEstadoPayload } from '../constants';
import type { ICrearRuta, IFiltroRutaEfectiva, IReemplazarPasos, IRuta, IRutaEfectiva } from './types';

const BASE = `${EMAIL_ADMIN}/rutas`;

export const rutaEmailRepository = {
  list(): Promise<IRuta[]> {
    return emailGatewayFetch.get<IRuta[]>(BASE, SIN_CACHE);
  },

  /** Crea la ruta; si existe una inactiva para (proveedor, tipo) el gateway la reactiva con estos pasos. */
  create(payload: ICrearRuta): Promise<IRuta> {
    return emailGatewayFetch.post<IRuta>(BASE, payload);
  },

  reemplazarPasos({ ruta_id, pasos }: IReemplazarPasos): Promise<IRuta> {
    return emailGatewayFetch.put<IRuta>(`${BASE}/${ruta_id}/pasos`, { pasos });
  },

  cambiarEstado(id: number, payload: IEstadoPayload): Promise<IRuta> {
    return emailGatewayFetch.patch<IRuta>(`${BASE}/${id}/estado`, payload);
  },

  /** Simula el planner: qué cuentas y en qué orden usaría un envío. */
  efectiva(filtro: IFiltroRutaEfectiva): Promise<IRutaEfectiva> {
    return emailGatewayFetch.get<IRutaEfectiva>(`${BASE}/efectiva`, { ...SIN_CACHE, params: { ...filtro } });
  },
} as const;
