import type { IAuditoria } from '../constants';

/** Contrato de /admin/tipos-mensaje. */
export interface ITipoMensaje extends IAuditoria {
  id: number;
  /** Valor de tipo_mensaje en rutas y envíos (OTP, TRANSACCIONAL...). */
  codigo: string;
  descripcion?: string | null;
  /** 1 (alta) … 9 (baja): orden de salida en la cola. */
  prioridad: number;
  masivo: boolean;
}

export interface ICrearTipoMensaje {
  codigo: string;
  descripcion?: string | null;
  prioridad?: number;
  masivo?: boolean;
}

export type IActualizarTipoMensaje = ICrearTipoMensaje;
