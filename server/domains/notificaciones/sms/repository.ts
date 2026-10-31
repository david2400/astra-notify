import 'server-only';

import { notificacionFetch, smsGatewayFetch } from '@/server/lib/server-fetch';
import type { IEnvioCola, IEnvioColaAceptado, ILoteCola, ILoteColaAceptado } from '../cola';
import { esperar, ESTADOS_FINALES, MAX_BLOQUES_CONSULTA } from '../cola';
import type {
  EstadoCola,
  EstadoSms,
  IEnviarSms,
  IEnviarSmsLote,
  IFiltroSms,
  IPaginaSms,
  ISmsEnvio,
  ISmsLoteResultado,
  ISmsResultado,
} from './types';

const SIN_CACHE = { revalidate: 0 } as const;

/** Lo que se espera a que la cola envíe antes de responder "en proceso" (el usuario puede consultar después). */
const ESPERA_INDIVIDUAL_MS = 20_000;
const ESPERA_LOTE_MS = 30_000;
/** Tamaño de bloque por defecto de notificacion (notificacion.envios.sms.tamano-bloque-lote). */
const BLOQUE_DEFECTO = 200;

const esFinal = (estado: EstadoCola) => ESTADOS_FINALES.has(estado);

/** Respuesta de sms_gateway guardada por la cola (SmsEnvioResponse). */
interface IGatewaySms {
  envio_id?: string;
  estado?: EstadoSms;
  proveedor?: string | null;
  cuenta?: string | null;
  http_status?: number | null;
  intentos?: number;
  codigo_error?: string | null;
  detalle?: string | null;
}

/** Respuesta de sms_gateway a un bloque masivo (SmsBatchResponse). */
interface IGatewaySmsLote {
  lote_id?: string;
  total?: number;
  resultados?: IGatewaySms[];
}

const objeto = <T>(v: unknown): T | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : null);

/** Estado de la cola → estado que muestran las pantallas (el del gateway cuando ya terminó). */
const estadoSms = (e: EstadoCola): EstadoSms => (e === 'ENVIADO' || e === 'ACEPTADO' ? 'ENVIADO' : esFinal(e) ? 'FALLIDO' : 'EN_PROCESO');

/** Envío individual de la cola → resultado de SMS (con lo que respondió sms_gateway, si ya salió). */
export function aResultadoSms(e: IEnvioCola): ISmsResultado {
  const gw = objeto<IGatewaySms>(e.resultado) ?? {};
  const estado = estadoSms(e.estado);
  return {
    envio_id: e.envio_id,
    gateway_envio_id: e.gateway_envio_id ?? gw.envio_id ?? null,
    estado_cola: e.estado,
    proximo_intento: e.proximo_intento ?? null,
    estado: esFinal(e.estado) && gw.estado ? gw.estado : estado,
    proveedor: gw.proveedor ?? null,
    cuenta: gw.cuenta ?? null,
    http_status: gw.http_status ?? null,
    intentos: gw.intentos ?? e.intentos ?? 0,
    codigo_error: e.codigo_error ?? gw.codigo_error ?? null,
    detalle: e.detalle_error ?? gw.detalle ?? null,
  };
}

/**
 * Une los bloques del lote (en orden) en un resultado por destinatario. Un bloque sin respuesta por destinatario
 * (pendiente o rechazado completo) aporta tantas filas como destinatarios tiene, con el estado del bloque.
 */
export function aResultadoLote(lote: ILoteColaAceptado, bloques: (IEnvioCola | null)[], plantilla?: string): ISmsLoteResultado {
  const total = lote.total_destinatarios;
  const k = Math.max(1, bloques.length);
  const respuestas = bloques.map((b) => (b?.operacion === 'SMS_ENVIO' ? [{} as IGatewaySms] : (objeto<IGatewaySmsLote>(b?.resultado)?.resultados ?? null)));
  // Todos los bloques tienen el mismo tamaño salvo el último (notificacion corta la lista en orden)
  const conocido = respuestas.findIndex((r, i) => r !== null && i < k - 1);
  let tamano: number;
  if (k === 1) tamano = total;
  else if (conocido >= 0) tamano = respuestas[conocido]!.length;
  else if (respuestas[k - 1]) tamano = Math.round((total - respuestas[k - 1]!.length) / (k - 1));
  else tamano = (k - 1) * BLOQUE_DEFECTO < total && total <= k * BLOQUE_DEFECTO ? BLOQUE_DEFECTO : Math.ceil(total / k);

  const resultados: ISmsResultado[] = [];
  bloques.forEach((b, i) => {
    const filas = i < k - 1 ? tamano : Math.max(0, total - tamano * (k - 1));
    // Plantilla local con variables por destinatario: notificacion crea un SMS_ENVIO por destinatario
    if (b && b.operacion === 'SMS_ENVIO') {
      resultados.push(aResultadoSms(b));
      return;
    }
    const r = respuestas[i];
    if (r) {
      for (const g of r) {
        resultados.push({
          envio_id: g.envio_id ?? b?.envio_id ?? '',
          gateway_envio_id: g.envio_id ?? null,
          estado: g.estado ?? 'FALLIDO',
          proveedor: g.proveedor ?? null,
          cuenta: g.cuenta ?? null,
          http_status: g.http_status ?? null,
          intentos: g.intentos ?? 0,
          codigo_error: g.codigo_error ?? null,
          detalle: g.detalle ?? null,
        });
      }
      return;
    }
    const estado: EstadoSms = b ? estadoSms(b.estado) : 'EN_PROCESO';
    for (let j = 0; j < filas; j++) {
      resultados.push({
        envio_id: b?.envio_id ?? lote.envios?.[i] ?? '',
        estado_cola: b?.estado,
        estado,
        intentos: b?.intentos ?? 0,
        codigo_error: b?.codigo_error ?? null,
        detalle: b ? (b.detalle_error ?? (estado === 'EN_PROCESO' ? 'En la cola de notificacion' : null)) : 'No se pudo consultar el bloque',
      });
    }
  });
  return {
    lote_id: lote.lote_id,
    plantilla: plantilla ?? null,
    total,
    enviados: resultados.filter((r) => r.estado === 'ENVIADO').length,
    fallidos: resultados.filter((r) => r.estado === 'FALLIDO').length,
    pendientes: resultados.filter((r) => r.estado === 'EN_PROCESO').length,
    finalizado: bloques.every((b) => b !== null && esFinal(b.estado)),
    envios: lote.envios ?? [],
    resultados,
  };
}

const ruta = (id: string) => `/v1/envios/${encodeURIComponent(id)}`;

export const envioSmsRepository = {
  /** Estado de un envío de la cola. */
  envio(envioId: string): Promise<IEnvioCola> {
    return notificacionFetch.get<IEnvioCola>(ruta(envioId), SIN_CACHE);
  },

  /**
   * Envío individual por la cola de notificacion (202). Se espera unos segundos a que salga para mostrar el
   * resultado; si sigue en la cola (reintentos programados) se responde "en proceso".
   */
  async enviar(payload: IEnviarSms, idempotencyKey?: string): Promise<ISmsResultado> {
    const aceptado = await notificacionFetch.post<IEnvioColaAceptado>('/v1/envios/sms', {
      ...payload,
      idempotency_key: idempotencyKey,
    });
    const final = await esperar(() => this.envio(aceptado.envio_id), (e) => esFinal(e.estado), ESPERA_INDIVIDUAL_MS);
    return aResultadoSms(final);
  },

  async resultado(envioId: string): Promise<ISmsResultado> {
    return aResultadoSms(await this.envio(envioId));
  },

  /** Masivo por la cola: notificacion lo divide en bloques; se espera a que terminen o al tiempo máximo. */
  async enviarLote(payload: IEnviarSmsLote): Promise<ISmsLoteResultado> {
    const { destinations, ...resto } = payload;
    const lote = await notificacionFetch.post<ILoteColaAceptado>('/v1/envios/sms/lote', { ...resto, destinatarios: destinations });
    await esperar(
      () => notificacionFetch.get<ILoteCola>(`/v1/envios/lotes/${encodeURIComponent(lote.lote_id)}`, SIN_CACHE),
      (l) => l.finalizado,
      ESPERA_LOTE_MS,
    );
    return this.resultadoLote(lote, payload.plantilla);
  },

  /** Resultado actual del lote (consulta cada bloque de la cola). */
  async resultadoLote(lote: ILoteColaAceptado, plantilla?: string): Promise<ISmsLoteResultado> {
    let bloques: (IEnvioCola | null)[];
    if (lote.envios?.length) {
      bloques = await Promise.all(lote.envios.slice(0, MAX_BLOQUES_CONSULTA).map((id) => this.envio(id).catch(() => null)));
    } else {
      // Más de 100 envíos: notificacion no devuelve los ids; se listan por lote en orden de creación
      const pagina = await notificacionFetch.get<{ contenido: IEnvioCola[] }>('/v1/envios', {
        ...SIN_CACHE,
        params: { lote_id: lote.lote_id, size: 200 },
      });
      bloques = [...pagina.contenido].reverse();
    }
    return aResultadoLote({ ...lote, envios: bloques.map((b, i) => b?.envio_id ?? lote.envios?.[i] ?? '') }, bloques, plantilla);
  },

  /** Historial de entrega de sms_gateway (por el proxy de notificacion). */
  buscar(filtro: IFiltroSms): Promise<IPaginaSms> {
    return smsGatewayFetch.get<IPaginaSms>('/envios', { ...SIN_CACHE, params: { ...filtro } });
  },

  detalle(envioId: string): Promise<ISmsEnvio> {
    return smsGatewayFetch.get<ISmsEnvio>(`/envios/${encodeURIComponent(envioId)}`, SIN_CACHE);
  },
} as const;
