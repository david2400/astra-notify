import 'server-only';

import { smsGatewayFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, SMS_ADMIN, type IEstadoPayload } from '../constants';
import type { IActualizarCuenta, ICrearCuenta, ICuenta, IFiltroCuentas } from './types';

const BASE = `${SMS_ADMIN}/cuentas`;

export const cuentaRepository = {
  list(filtro: IFiltroCuentas = {}): Promise<ICuenta[]> {
    return smsGatewayFetch.get<ICuenta[]>(BASE, { ...SIN_CACHE, params: { ...filtro } });
  },

  getById(id: number): Promise<ICuenta> {
    return smsGatewayFetch.get<ICuenta>(`${BASE}/${id}`, SIN_CACHE);
  },

  create(payload: ICrearCuenta): Promise<ICuenta> {
    return smsGatewayFetch.post<ICuenta>(BASE, payload);
  },

  update({ id, ...payload }: IActualizarCuenta): Promise<ICuenta> {
    return smsGatewayFetch.put<ICuenta>(`${BASE}/${id}`, payload);
  },

  cambiarEstado(id: number, payload: IEstadoPayload): Promise<ICuenta> {
    return smsGatewayFetch.patch<ICuenta>(`${BASE}/${id}/estado`, payload);
  },
} as const;
