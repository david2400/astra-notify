import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import type { IEmailLoteResultado, IEmailResultado, IEnviarEmail, IEnviarEmailLote } from './types';

export const envioEmailNotifRepository = {
  /** 202 = encolado; 200 = finalizado (SINCRONO) o duplicado por idempotencia. */
  enviar(payload: IEnviarEmail): Promise<IEmailResultado> {
    return emailGatewayFetch.post<IEmailResultado>('/email/send', payload);
  },

  /** 202 = lote encolado; 422 = rechazado (errores por destinatario en el cuerpo). */
  enviarLote(payload: IEnviarEmailLote): Promise<IEmailLoteResultado> {
    return emailGatewayFetch.post<IEmailLoteResultado>('/email/lotes', payload);
  },
} as const;
