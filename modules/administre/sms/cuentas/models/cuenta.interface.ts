/** @format */

export type { ICuenta, ICrearCuenta, IActualizarCuenta } from '@/server/domains/administre/sms/cuentas/types';

/** Valores del formulario. parametros se edita como texto JSON. */
export interface ICuentaForm {
  proveedor_id: string;
  codigo: string;
  usuario: string;
  clave: string;
  secret_ref: string;
  remitente: string;
  parametros: string;
}

export const CUENTA_FORM_DEFAULT: ICuentaForm = {
  proveedor_id: '',
  codigo: '',
  usuario: '',
  clave: '',
  secret_ref: '',
  remitente: '',
  parametros: '{}',
};
