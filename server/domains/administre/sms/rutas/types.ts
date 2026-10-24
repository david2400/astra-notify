/** Contrato de /admin/rutas (RutaRequest / RutaResponse / PasosRequest / RutaEfectivaResponse). */
export interface IPaso {
  id?: number;
  /** 1 = principal, 2.. = respaldo. */
  orden: number;
  cuenta_id: number;
  cuenta_codigo: string;
  proveedor_codigo: string;
  max_intentos: number;
  espera_ms: number;
}

export interface IRuta {
  id: number;
  /** null = ruta del endpoint central (/v1/sms/send). */
  proveedor_id: number | null;
  /** CENTRAL o código del proveedor. */
  proveedor_codigo: string;
  tipo_mensaje_id: number;
  tipo_mensaje: string;
  pasos: IPaso[];
  eliminado: boolean;
}

export interface IPasoPayload {
  orden: number;
  cuenta_id: number;
  max_intentos?: number;
  espera_ms?: number;
}

export interface ICrearRuta {
  proveedor_id: number | null;
  tipo_mensaje_id: number;
  pasos?: IPasoPayload[];
}

export interface IReemplazarPasos {
  ruta_id: number;
  pasos: IPasoPayload[];
}

export interface IFiltroRutas {
  proveedor_id?: number;
  central?: boolean;
  tipo_mensaje?: string;
}

export interface IPasoEfectivo {
  orden: number;
  proveedor: string;
  cuenta: string;
  max_intentos: number;
  espera_ms: number;
  credenciales_ok: boolean;
  implementado: boolean;
}

export interface IRutaEfectiva {
  proveedor: string;
  tipo_mensaje: string;
  /** false: no hay ruta activa con pasos y el envío respondería 422. */
  configurada: boolean;
  pasos: IPasoEfectivo[];
  advertencias: string[];
}

export interface IFiltroRutaEfectiva {
  /** Código del proveedor; vacío = central. */
  proveedor?: string;
  tipo_mensaje: string;
}
