import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import { cod, EMAIL_ADMIN, SIN_CACHE, type IEstadoPayload } from '../constants';
import type { IActualizarCuenta, ICrearCuenta, ICuenta, IVerificacionCuenta } from './types';

const BASE = `${EMAIL_ADMIN}/cuentas`;

export const cuentaEmailRepository = {
  list(proveedor?: string): Promise<ICuenta[]> {
    return emailGatewayFetch.get<ICuenta[]>(BASE, { ...SIN_CACHE, params: { proveedor } });
  },

  create(payload: ICrearCuenta): Promise<ICuenta> {
    return emailGatewayFetch.post<ICuenta>(BASE, payload);
  },

  update(payload: IActualizarCuenta): Promise<ICuenta> {
    return emailGatewayFetch.put<ICuenta>(`${BASE}/${cod(payload.codigo)}`, payload);
  },

  cambiarEstado(codigo: string, payload: IEstadoPayload): Promise<ICuenta> {
    return emailGatewayFetch.patch<ICuenta>(`${BASE}/${cod(codigo)}/estado`, payload);
  },

  /** Prueba conexión y credenciales (Gmail: login SMTP; Brevo: GET /account) sin enviar emails. */
  probar(codigo: string): Promise<IVerificacionCuenta> {
    return emailGatewayFetch.post<IVerificacionCuenta>(`${BASE}/${cod(codigo)}/probar`);
  },
} as const;
