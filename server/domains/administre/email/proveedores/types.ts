import type { IAuditoria } from '../constants';

/** Contrato de /admin/proveedores (ProveedorRequest / ProveedorResponse). */
export interface IProveedor extends IAuditoria {
  id: number;
  /** GMAIL, BREVO, MOCK (= EmailSenderPort.providerCode()). */
  codigo: string;
  nombre: string;
  /** GMAIL: host SMTP; BREVO: URL base de la API. */
  base_url: string;
  connect_timeout_ms: number;
  read_timeout_ms: number;
  /** true si el gateway tiene implementación para este código. */
  implementado: boolean;
  /** Tipos de mensaje que atiende. */
  servicios?: string[];
}

export interface ICrearProveedor {
  codigo: string;
  nombre: string;
  base_url: string;
  connect_timeout_ms?: number;
  read_timeout_ms?: number;
}

export type IActualizarProveedor = ICrearProveedor;
