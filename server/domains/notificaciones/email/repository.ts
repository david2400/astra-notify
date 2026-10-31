import 'server-only';

import { notificacionFetch } from '@/server/lib/server-fetch';
import type { EstadoEnvio } from '@/server/domains/administre/email/envios/types';
import type { IEnvioCola, IEnvioColaAceptado, ILoteColaAceptado } from '../cola';
import { esperar, ESTADOS_FINALES, MAX_BLOQUES_CONSULTA } from '../cola';
import type { IEmailLoteResultado, IEmailResultado, IEnviarEmail, IEnviarEmailLote } from './types';

const SIN_CACHE = { revalidate: 0 } as const;
/** Espera del resultado del proveedor cuando el usuario lo pide ("esperar el resultado"). */
const ESPERA_RESULTADO_MS = 20_000;
/** Espera a que la cola entregue los bloques del lote a email_gateway (para mostrar sus rechazos). */
const ESPERA_LOTE_MS = 15_000;
/** Tamaño de bloque por defecto de notificacion (notificacion.envios.email.tamano-bloque-lote). */
const BLOQUE_DEFECTO = 500;

const ESTADOS_GATEWAY_FINALES = new Set(['ENVIADO', 'FALLIDO', 'CANCELADO']);

const objeto = <T>(v: unknown): T | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : null);

/** Envío en email_gateway: respuesta del POST (resultado) o detalle consultado en vivo (gateway). */
interface IGatewayEmail {
  envio_id?: string;
  estado?: EstadoEnvio;
  tipo_mensaje?: string;
  proveedor?: string;
  cuenta?: string;
  provider_message_id?: string;
  total_intentos?: number;
  codigo_error?: string;
  detalle_error?: string;
  programado_para?: string;
  created_at?: string;
}

/** Respuesta de email_gateway a un bloque (POST /v1/email/lotes). */
interface IGatewayEmailLote {
  lote_id?: string;
  total?: number;
  aceptados?: number;
  rechazados?: number;
  errores?: IEmailLoteResultado['errores'];
}

/** El detalle de email_gateway puede venir como envío o como { envio: ... }. */
const detalleGateway = (g: unknown): IGatewayEmail | null => {
  const o = objeto<{ envio?: IGatewayEmail } & IGatewayEmail>(g);
  return o ? (objeto<IGatewayEmail>(o.envio) ?? o) : null;
};

/** Estado de la cola → estado de email (el de email_gateway cuando ya lo tiene). */
const estadoEmail = (e: IEnvioCola, gw: IGatewayEmail | null): EstadoEnvio => {
  if (gw?.estado) return gw.estado;
  switch (e.estado) {
    case 'ENVIADO':
    case 'FALLIDO':
    case 'CANCELADO':
    case 'EN_PROCESO':
      return e.estado;
    case 'PARCIAL':
      return 'ENVIADO';
    default:
      // PENDIENTE en la cola o ACEPTADO por el gateway (en su propia cola)
      return 'PENDIENTE';
  }
};

export function aResultadoEmail(e: IEnvioCola, duplicado = false, programadoPara?: string): IEmailResultado {
  const gw = detalleGateway(e.gateway) ?? objeto<IGatewayEmail>(e.resultado);
  return {
    envio_id: e.envio_id,
    gateway_envio_id: e.gateway_envio_id ?? gw?.envio_id,
    estado_cola: e.estado,
    estado: estadoEmail(e, gw),
    duplicado,
    tipo_mensaje: gw?.tipo_mensaje,
    proveedor: gw?.proveedor,
    cuenta: gw?.cuenta,
    provider_message_id: gw?.provider_message_id,
    total_intentos: gw?.total_intentos ?? e.intentos,
    codigo_error: e.codigo_error ?? gw?.codigo_error,
    detalle_error: e.detalle_error ?? gw?.detalle_error,
    programado_para: gw?.programado_para ?? programadoPara,
    created_at: e.created_at ?? gw?.created_at,
  };
}

/** Une los bloques del lote: aceptados, rechazados y errores con el índice del destinatario en el lote completo. */
export function aResultadoLoteEmail(lote: ILoteColaAceptado, bloques: (IEnvioCola | null)[]): IEmailLoteResultado {
  const total = lote.total_destinatarios;
  const k = Math.max(1, bloques.length);
  const respuestas = bloques.map((b) => objeto<IGatewayEmailLote>(b?.resultado));
  const conocido = respuestas.findIndex((r, i) => typeof r?.total === 'number' && i < k - 1);
  const tamano =
    k === 1
      ? total
      : conocido >= 0
        ? respuestas[conocido]!.total!
        : (k - 1) * BLOQUE_DEFECTO < total && total <= k * BLOQUE_DEFECTO
          ? BLOQUE_DEFECTO
          : Math.ceil(total / k);

  let aceptados = 0;
  let rechazados = 0;
  let enCola = 0;
  const errores: NonNullable<IEmailLoteResultado['errores']> = [];
  bloques.forEach((b, i) => {
    const filas = i < k - 1 ? tamano : Math.max(0, total - tamano * (k - 1));
    const r = respuestas[i];
    if (r && typeof r.total === 'number') {
      aceptados += r.aceptados ?? 0;
      rechazados += r.rechazados ?? 0;
      for (const err of r.errores ?? []) errores.push({ ...err, indice: err.indice + i * tamano });
    } else if (b && (b.estado === 'FALLIDO' || b.estado === 'CANCELADO')) {
      rechazados += filas;
      errores.push({
        indice: i * tamano,
        email: `bloque ${i + 1} (${filas} destinatario${filas === 1 ? '' : 's'})`,
        codigo: b.codigo_error ?? b.estado,
        mensaje: b.detalle_error ?? 'El bloque no se pudo entregar a email_gateway',
      });
    } else {
      // Aún en la cola de notificacion: cuenta como aceptado (se enviará)
      aceptados += filas;
      enCola += filas;
    }
  });
  return {
    lote_id: lote.lote_id,
    duplicado: lote.duplicado,
    total,
    aceptados,
    rechazados,
    en_cola: enCola,
    errores: errores.sort((a, b) => a.indice - b.indice),
  };
}

export const envioEmailNotifRepository = {
  envio(envioId: string, detalle = false): Promise<IEnvioCola> {
    return notificacionFetch.get<IEnvioCola>(`/v1/envios/${encodeURIComponent(envioId)}`, {
      ...SIN_CACHE,
      params: detalle ? { detalle_gateway: true } : undefined,
    });
  },

  /**
   * Encola el correo en notificacion (202). Con modo SINCRONO (sin programar) se espera hasta ~20 s a que
   * email_gateway lo entregue al proveedor; si no, se responde con el estado de la cola.
   */
  async enviar({ modo, ...payload }: IEnviarEmail): Promise<IEmailResultado> {
    const aceptado = await notificacionFetch.post<IEnvioColaAceptado>('/v1/envios/email', payload);
    const esperarProveedor = modo === 'SINCRONO' && !payload.programado_para;
    const listo = (e: IEnvioCola) => {
      if (!esperarProveedor) return true;
      if (e.estado === 'FALLIDO' || e.estado === 'CANCELADO' || e.estado === 'ENVIADO') return true;
      const gw = detalleGateway(e.gateway);
      return Boolean(e.estado === 'ACEPTADO' && gw?.estado && ESTADOS_GATEWAY_FINALES.has(gw.estado));
    };
    const final = await esperar(() => this.envio(aceptado.envio_id, esperarProveedor), listo, esperarProveedor ? ESPERA_RESULTADO_MS : 0);
    return aResultadoEmail(final, aceptado.duplicado, payload.programado_para);
  },

  /** Lote por la cola: notificacion lo divide en bloques; se espera a que email_gateway los reciba. */
  async enviarLote(payload: IEnviarEmailLote): Promise<IEmailLoteResultado> {
    const lote = await notificacionFetch.post<ILoteColaAceptado>('/v1/envios/email/lote', payload);
    const ids = (lote.envios ?? []).slice(0, MAX_BLOQUES_CONSULTA);
    const consultar = () => Promise.all(ids.map((id) => this.envio(id).catch(() => null)));
    const programado = Boolean(payload.programado_para);
    const bloques = await esperar(
      consultar,
      (bs) => programado || bs.every((b) => b !== null && ESTADOS_FINALES.has(b.estado)),
      programado ? 0 : ESPERA_LOTE_MS,
    );
    return aResultadoLoteEmail(lote, ids.length ? bloques : []);
  },
} as const;
