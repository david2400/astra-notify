/** @format */

export type { IProveedor, ICrearProveedor, IActualizarProveedor } from '@/server/domains/administre/email/proveedores/types';

export interface IProveedorForm {
  codigo: string;
  nombre: string;
  base_url: string;
  connect_timeout_ms: number;
  read_timeout_ms: number;
}

export const PROVEEDOR_FORM_DEFAULT: IProveedorForm = {
  codigo: '',
  nombre: '',
  base_url: '',
  connect_timeout_ms: 5000,
  read_timeout_ms: 30000,
};

/** Sugerencia de URL base según el proveedor. */
export const BASE_URL_SUGERIDA: Record<string, string> = {
  GMAIL: 'smtp.gmail.com',
  BREVO: 'https://api.brevo.com/v3',
  MOCK: 'mock://local',
};
