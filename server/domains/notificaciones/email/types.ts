/** Contrato de POST /v1/email/send y /v1/email/lotes (email_gateway, JSON snake_case). */
import type { EstadoEnvio } from '@/server/domains/administre/email/envios/types';

export interface IDireccionEmail {
  email: string;
  nombre?: string;
}

export interface IAdjuntoEmail {
  nombre: string;
  content_type?: string;
  /** Base64 sin prefijo data:. */
  contenido_base64?: string;
  url?: string;
  content_id?: string;
}

export interface IEnviarEmail {
  tipo_mensaje?: string;
  proveedor_preferido?: string;
  cuenta?: string;
  para: IDireccionEmail[];
  cc?: IDireccionEmail[];
  cco?: IDireccionEmail[];
  responder_a?: IDireccionEmail;
  asunto?: string;
  html?: string;
  texto?: string;
  plantilla?: string;
  variables?: Record<string, string>;
  adjuntos?: IAdjuntoEmail[];
  etiquetas?: string[];
  prioridad?: number;
  /** ISO-8601 UTC. */
  programado_para?: string;
  idempotency_key?: string;
  modo?: 'ASINCRONO' | 'SINCRONO';
}

export interface IEmailResultado {
  envio_id: string;
  estado: EstadoEnvio;
  duplicado: boolean;
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

export interface IDestinatarioLoteEmail {
  email: string;
  nombre?: string;
  cc?: IDireccionEmail[];
  cco?: IDireccionEmail[];
  variables?: Record<string, string>;
  referencia?: string;
}

export interface IEnviarEmailLote {
  tipo_mensaje?: string;
  proveedor_preferido?: string;
  cuenta?: string;
  plantilla?: string;
  asunto?: string;
  html?: string;
  texto?: string;
  responder_a?: IDireccionEmail;
  adjuntos?: IAdjuntoEmail[];
  etiquetas?: string[];
  prioridad?: number;
  programado_para?: string;
  idempotency_key?: string;
  rechazar_si_hay_errores?: boolean;
  destinatarios: IDestinatarioLoteEmail[];
}

export interface IEmailLoteResultado {
  lote_id?: string;
  duplicado: boolean;
  total: number;
  aceptados: number;
  rechazados: number;
  envios?: { indice: number; email: string; referencia?: string; envio_id: string }[];
  errores?: { indice: number; email: string; codigo: string; mensaje: string; variables?: { variable?: string; codigo: string; mensaje: string }[] }[];
}
