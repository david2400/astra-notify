import 'server-only';

import { smsGatewayFetch } from '@/server/lib/server-fetch';
import type { IEnviarSms, IEnviarSmsLote, IFiltroSms, IPaginaSms, ISmsEnvio, ISmsLoteResultado, ISmsResultado } from './types';

const SIN_CACHE = { revalidate: 0 } as const;

export const envioSmsRepository = {
  /** Envío individual (síncrono: responde con el resultado final). */
  enviar(payload: IEnviarSms, idempotencyKey?: string): Promise<ISmsResultado> {
    return smsGatewayFetch.post<ISmsResultado>('/send', payload, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
  },

  /** Masivo: hasta 5000 destinatarios; con plantilla, si alguno es inválido no se envía ninguno. */
  enviarLote(payload: IEnviarSmsLote): Promise<ISmsLoteResultado> {
    return smsGatewayFetch.post<ISmsLoteResultado>('/batch', payload);
  },

  buscar(filtro: IFiltroSms): Promise<IPaginaSms> {
    return smsGatewayFetch.get<IPaginaSms>('/envios', { ...SIN_CACHE, params: { ...filtro } });
  },

  detalle(envioId: string): Promise<ISmsEnvio> {
    return smsGatewayFetch.get<ISmsEnvio>(`/envios/${encodeURIComponent(envioId)}`, SIN_CACHE);
  },
} as const;
