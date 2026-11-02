/** Contrato de /v1/email/envios, /v1/email/lotes y /v1/email/send (prueba desde la administración). */
export type EstadoEnvio = 'PENDIENTE' | 'EN_PROCESO' | 'REINTENTO' | 'ENVIADO' | 'FALLIDO' | 'CANCELADO';

export type EstadoEntrega =
  | 'SOLICITADO' | 'DIFERIDO' | 'REBOTE_SUAVE' | 'ENTREGADO' | 'ABIERTO' | 'CLIC'
  | 'DESUSCRITO' | 'SPAM' | 'REBOTE_DURO' | 'INVALIDO' | 'BLOQUEADO' | 'ERROR';

export interface IEnvio {
  envio_id: string;
  lote_id?: string;
  canal?: string;
  tipo_mensaje: string;
  destino_principal: string;
  total_destinatarios?: number;
  asunto?: string;
  plantilla?: string;
  prioridad?: number;
  estado: EstadoEnvio;
  estado_entrega?: EstadoEntrega;
  proveedor?: string;
  cuenta?: string;
  provider_message_id?: string;
  total_intentos?: number;
  codigo_error?: string;
  detalle_error?: string;
  programado_para?: string;
  proximo_intento?: string;
  fecha_finalizacion?: string;
  fecha_estado_entrega?: string;
  created_at?: string;
}

export interface IDireccion {
  email: string;
  nombre?: string;
}

export interface IEnvioDetalle {
  envio: IEnvio;
  para?: IDireccion[];
  /** Contenido tal como se envió (variables ya aplicadas); null si se depuró. */
  cuerpo_html?: string | null;
  cuerpo_texto?: string | null;
  plantilla_version?: number | null;
  cc?: IDireccion[];
  cco?: IDireccion[];
  adjuntos?: { nombre: string; content_type?: string; tamano_bytes?: number; url?: string; content_id?: string; compartido: boolean }[];
  intentos?: {
    paso_orden: number;
    nro_intento: number;
    proveedor?: string;
    cuenta?: string;
    exitoso: boolean;
    codigo_respuesta?: number;
    detalle?: string;
    duracion_ms?: number;
    fecha?: string;
  }[];
  eventos?: { evento: string; estado_entrega?: string; email?: string; motivo?: string; fecha_evento?: string }[];
}

export interface IFiltroEnvios {
  destino?: string;
  estado?: string;
  estado_entrega?: string;
  tipo_mensaje?: string;
  proveedor?: string;
  lote_id?: string;
  /** Código de plantilla. */
  plantilla?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  size?: number;
}

/** Filtro de /v1/email/envios/estadisticas (sin periodo: últimos 30 días; máximo 366). */
export interface IFiltroEstadisticas {
  plantilla?: string;
  tipo_mensaje?: string;
  desde?: string;
  hasta?: string;
  /** Minutos a sumar a UTC para agrupar por día local (Colombia: -300). */
  tz_offset?: number;
}

export interface ITotalesEnvio {
  total: number;
  enviados: number;
  fallidos: number;
  en_cola: number;
  cancelados: number;
  entregados: number;
  abiertos: number;
  clics: number;
  rebotes_suaves: number;
  rebotes_duros: number;
  spam: number;
  desuscritos: number;
  bloqueados: number;
  aperturas_totales: number;
  clics_totales: number;
}

/** Porcentajes (null = sin base para calcular). */
export interface ITasasEnvio {
  entrega: number | null;
  apertura: number | null;
  clic: number | null;
  clic_sobre_apertura: number | null;
  rebote: number | null;
  spam: number | null;
  desuscripcion: number | null;
  fallo: number | null;
}

export interface IPuntoSerie {
  /** yyyy-MM-dd (día local). */
  fecha: string;
  total: number;
  enviados: number;
  entregados: number;
  abiertos: number;
  clics: number;
  rebotes: number;
  fallidos: number;
}

/** Métricas de un periodo; en el listado por plantilla `serie` va vacía y viene `ultimo_envio`. */
export interface IEstadisticasEnvio {
  plantilla?: string | null;
  tipo_mensaje?: string | null;
  desde: string;
  hasta: string;
  totales: ITotalesEnvio;
  tasas: ITasasEnvio;
  serie: IPuntoSerie[];
  ultimo_envio?: string | null;
}

export interface IPagina<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface ILote {
  lote_id: string;
  tipo_mensaje?: string;
  plantilla?: string;
  total?: number;
  por_estado?: Record<string, number>;
  por_estado_entrega?: Record<string, number>;
  finalizado: boolean;
  created_at?: string;
}

/** Envío de prueba (POST /v1/email/send en modo SINCRONO). */
export interface IEnvioPrueba {
  tipo_mensaje?: string;
  proveedor_preferido?: string;
  cuenta?: string;
  para: IDireccion[];
  asunto?: string;
  html?: string;
  texto?: string;
  plantilla?: string;
  variables?: Record<string, string>;
  modo: 'SINCRONO' | 'ASINCRONO';
}

export interface IEnvioPruebaRespuesta {
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
}
