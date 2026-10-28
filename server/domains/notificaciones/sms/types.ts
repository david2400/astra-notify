/** Contrato de /v1/sms/send, /v1/sms/batch y /v1/sms/envios (sms_gateway, JSON snake_case). */
export type EstadoSms = 'EN_PROCESO' | 'ENVIADO' | 'FALLIDO';

export interface IEnviarSms {
  tipo_mensaje?: string;
  to: string;
  country_code?: string;
  /** Texto libre (excluyente con plantilla). */
  message?: string;
  plantilla?: string;
  variables?: Record<string, string>;
  /** Proveedor preferido. */
  proveedor?: string;
  sender?: string;
  cuenta?: string;
}

export interface ISmsResultado {
  envio_id: string;
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
  destinations: IDestinatarioSms[];
}

export interface ISmsLoteResultado {
  lote_id?: string;
  plantilla?: string | null;
  total: number;
  enviados: number;
  fallidos: number;
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
