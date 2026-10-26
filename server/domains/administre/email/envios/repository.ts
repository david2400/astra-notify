import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import { EMAIL_ENVIOS, SIN_CACHE } from '../constants';
import type { IEnvio, IEnvioDetalle, IEnvioPrueba, IEnvioPruebaRespuesta, IFiltroEnvios, ILote, IPagina } from './types';

const BASE = `${EMAIL_ENVIOS}/envios`;
const id = (envioId: string) => encodeURIComponent(envioId);

export const envioEmailRepository = {
  buscar(filtro: IFiltroEnvios): Promise<IPagina<IEnvio>> {
    return emailGatewayFetch.get<IPagina<IEnvio>>(BASE, { ...SIN_CACHE, params: { ...filtro } });
  },

  detalle(envioId: string): Promise<IEnvioDetalle> {
    return emailGatewayFetch.get<IEnvioDetalle>(`${BASE}/${id(envioId)}/detalle`, SIN_CACHE);
  },

  cancelar(envioId: string): Promise<IEnvio> {
    return emailGatewayFetch.post<IEnvio>(`${BASE}/${id(envioId)}/cancelar`);
  },

  reintentar(envioId: string): Promise<IEnvio> {
    return emailGatewayFetch.post<IEnvio>(`${BASE}/${id(envioId)}/reintentar`);
  },

  lote(loteId: string): Promise<ILote> {
    return emailGatewayFetch.get<ILote>(`${EMAIL_ENVIOS}/lotes/${id(loteId)}`, SIN_CACHE);
  },

  enviarPrueba(payload: IEnvioPrueba): Promise<IEnvioPruebaRespuesta> {
    return emailGatewayFetch.post<IEnvioPruebaRespuesta>(`${EMAIL_ENVIOS}/send`, payload);
  },
} as const;
