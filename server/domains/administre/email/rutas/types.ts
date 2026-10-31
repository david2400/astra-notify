import type { IAuditoria } from '../constants';

/** Contrato de /admin/rutas (RutaRequest / RutaResponse / PasosRequest / RutaEfectivaResponse). */
export interface IPaso {
  /** 1 = principal, 2.. = respaldo. */
  orden: number;
  cuenta: string;
  proveedor: string;
  max_intentos: number;
  /** Base del backoff exponencial entre reintentos. */
  espera_ms: number;
  /** Cuenta y proveedor activos. */
  activo: boolean;
}

export interface IRuta extends IAuditoria {
  id: number;
  /** Código de la ruta (único por canal); null = sin código. */
  codigo?: string | null;
  /** null/ausente = ruta CENTRAL (/v1/email/send). */
  proveedor?: string | null;
  tipo_mensaje: string;
  pasos: IPaso[];
}

export interface IPasoPayload {
  cuenta: string;
  max_intentos?: number;
  espera_ms?: number;
}

export interface ICrearRuta {
  /** Opcional, único por canal (se guarda en mayúsculas). */
  codigo?: string | null;
  /** null = CENTRAL. */
  proveedor: string | null;
  tipo_mensaje: string;
  /** En el orden de fallback. */
  pasos: IPasoPayload[];
}

export interface IReemplazarPasos {
  ruta_id: number;
  pasos: IPasoPayload[];
}

export interface IFiltroRutaEfectiva {
  tipo_mensaje: string;
  /** Canal PROVEEDOR (solo su ruta). */
  proveedor?: string;
  proveedor_preferido?: string;
  cuenta?: string;
}

export interface IRutaEfectiva {
  tipo_mensaje: string;
  proveedor?: string;
  proveedor_preferido?: string;
  cuenta?: string;
  /** false: el envío respondería 422 con codigo_error. */
  ok: boolean;
  codigo_error?: string;
  detalle?: string;
  pasos?: IPaso[];
}
