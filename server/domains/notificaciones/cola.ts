import 'server-only';

import type { EstadoCola } from './sms/types';

/**
 * Cola de envíos asíncronos de notificacion (/api/notificacion/v1/envios, JSON snake_case).
 * Los envíos se crean con POST /v1/envios/{sms|email}[/lote] (202) y se consultan por id.
 */
export interface IEnvioColaAceptado {
  envio_id: string;
  estado: EstadoCola;
  canal: 'SMS' | 'EMAIL';
  /** true = ya existía un envío con la misma idempotency_key. */
  duplicado: boolean;
  referencia?: string | null;
  proximo_intento?: string | null;
  created_at?: string | null;
}

export interface ILoteColaAceptado {
  lote_id: string;
  canal: 'SMS' | 'EMAIL';
  total_destinatarios: number;
  /** Envíos de la cola (bloques) en que se dividió el lote. */
  total_envios: number;
  duplicado: boolean;
  /** Ids de esos envíos en orden (notificacion los omite si son más de 100). */
  envios?: string[] | null;
}

export interface IEnvioCola {
  envio_id: string;
  canal: 'SMS' | 'EMAIL';
  /** SMS_ENVIO, SMS_LOTE, EMAIL_ENVIO, EMAIL_LOTE. */
  operacion: string;
  estado: EstadoCola;
  prioridad?: number;
  intentos?: number;
  max_intentos?: number;
  proximo_intento?: string | null;
  lote_id?: string | null;
  referencia?: string | null;
  idempotency_key?: string | null;
  /** Id del envío (o lote) en el gateway. */
  gateway_envio_id?: string | null;
  codigo_error?: string | null;
  detalle_error?: string | null;
  /** Última respuesta del gateway (JSON). */
  resultado?: unknown;
  /** Detalle consultado en vivo en el gateway (solo con detalle_gateway=true). */
  gateway?: unknown;
  vence_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  finalizado_at?: string | null;
}

export interface ILoteCola {
  lote_id: string;
  total_envios: number;
  pendientes: number;
  finalizado: boolean;
  por_estado: Record<string, number>;
}

export const ESTADOS_FINALES: ReadonlySet<EstadoCola> = new Set<EstadoCola>(['ENVIADO', 'ACEPTADO', 'PARCIAL', 'FALLIDO', 'CANCELADO']);

/** Bloques de un lote que se consultan uno a uno para armar el resultado por destinatario. */
export const MAX_BLOQUES_CONSULTA = 100;

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Consulta hasta que `listo` se cumpla o se agote `maxMs` (intervalo creciente de 400 ms a 2 s) y devuelve la
 * última respuesta. Los errores de la consulta se propagan.
 */
export async function esperar<T>(consultar: () => Promise<T>, listo: (v: T) => boolean, maxMs: number): Promise<T> {
  const limite = Date.now() + maxMs;
  let pausa = 400;
  for (;;) {
    const v = await consultar();
    if (listo(v) || Date.now() + pausa > limite) return v;
    await dormir(pausa);
    pausa = Math.min(2000, Math.round(pausa * 1.5));
  }
}
