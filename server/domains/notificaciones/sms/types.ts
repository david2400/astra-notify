/**
 * Envíos de SMS por la cola de notificacion (POST /v1/envios/sms y /v1/envios/sms/lote, JSON snake_case) e
 * historial de entrega de sms_gateway por el proxy de notificacion (GET /v1/gateway/sms/envios).
 */
export type EstadoSms = 'EN_PROCESO' | 'ENVIADO' | 'FALLIDO';

/** Estado del envío en la cola de notificacion. */
export type EstadoCola = 'PENDIENTE' | 'EN_PROCESO' | 'ENVIADO' | 'ACEPTADO' | 'PARCIAL' | 'FALLIDO' | 'CANCELADO';

export interface IEnviarSms {
  tipo_mensaje?: string;
  to: string;
  country_code?: string;
  /** Texto libre (excluyente con plantilla). */
  message?: string;
  plantilla?: string;
  variables?: Record<string, string>;
  /** Código o id de la ruta (CanalRuta): ejecuta sus pasos en orden; no se combina con proveedor ni cuenta. */
  ruta?: string;
  /** Proveedor preferido. */
  proveedor?: string;
  sender?: string;
  cuenta?: string;
  /** 1 = máxima … 9 = mínima (por defecto 5). */
  prioridad?: number;
  /** Referencia del sistema origen (filtrable en la cola). */
  referencia?: string;
}

export interface ISmsResultado {
  /** Id del envío en la cola de notificacion. */
  envio_id: string;
  /** Id del envío en sms_gateway (cuando ya salió): es el que aparece en el historial. */
  gateway_envio_id?: string | null;
  estado_cola?: EstadoCola;
  proximo_intento?: string | null;
  estado: EstadoSms;
  proveedor?: string | null;
  cuenta?: string | null;
  http_status?: number | null;
  intentos: number;
  codigo_error?: string | null;
  detalle?: string | null;
}

export interface IDestinatarioSms {
  to: string;
  country_code?: string;
  variables?: Record<string, string>;
}

export interface IEnviarSmsLote {
  tipo_mensaje?: string;
  message?: string;
  plantilla?: string;
  /** Comunes a todos (cada destinatario puede sobrescribirlas). */
  variables?: Record<string, string>;
  proveedor?: string;
  sender?: string;
  cuenta?: string;
  prioridad?: number;
  referencia?: string;
  destinations: IDestinatarioSms[];
}

export interface ISmsLoteResultado {
  lote_id?: string;
  plantilla?: string | null;
  total: number;
  enviados: number;
  fallidos: number;
  /** Destinatarios que siguen en la cola (pendientes o reintentando). */
  pendientes: number;
  /** false = la cola aún tiene bloques del lote por enviar: se puede consultar otra vez. */
  finalizado: boolean;
  /** Envíos de la cola (bloques) en que notificacion dividió el lote, en orden. */
  envios: string[];
  /** En el mismo orden de los destinatarios. */
  resultados: ISmsResultado[];
}

export interface ISmsEnvio {
  envio_id: string;
  canal?: string;
  proveedor_solicitado?: string | null;
  tipo_mensaje: string;
  destino: string;
  mensaje: string;
  estado: EstadoSms;
  proveedor_final?: string | null;
  cuenta_final?: string | null;
  http_status_final?: number | null;
  total_intentos: number;
  codigo_error?: string | null;
  detalle_error?: string | null;
  fecha_creacion?: string | null;
  fecha_finalizacion?: string | null;
  intentos?: {
    paso_orden: number;
    nro_intento: number;
    proveedor?: string;
    cuenta?: string;
    exitoso: boolean;
    http_status?: number | null;
    detalle?: string | null;
    duracion_ms: number;
    fecha?: string;
  }[];
}

export interface IFiltroSms {
  destino?: string;
  estado?: string;
  tipo_mensaje?: string;
  proveedor?: string;
  /** ISO local sin zona (2026-10-19T00:00:00), como lo espera sms_gateway. */
  desde?: string;
  hasta?: string;
  page?: number;
  size?: number;
}

export interface IPaginaSms {
  content: ISmsEnvio[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}
