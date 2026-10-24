/** @format */

export type { IProveedor, ICrearProveedor, IActualizarProveedor } from '@/server/domains/administre/sms/proveedores/types';

/** Valores del formulario (los timeouts llegan como texto desde los inputs). */
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
  connect_timeout_ms: 3000,
  read_timeout_ms: 10000,
};
