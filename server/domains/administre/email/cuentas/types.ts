import type { IAuditoria } from '../constants';

/** Contrato de /admin/cuentas (CuentaRequest / CuentaResponse). */
export type ParametrosCuenta = Record<string, unknown>;

export interface ICuenta extends IAuditoria {
  id: number;
  /** Código del proveedor (GMAIL, BREVO, MOCK). */
  proveedor: string;
  codigo: string;
  /** GMAIL: usuario SMTP; admite 'env:VARIABLE'. */
  usuario?: string | null;
  /** Variable de entorno con el secreto (alternativa a la clave cifrada). */
  secret_ref?: string | null;
  /** Hay clave cifrada guardada (el valor nunca se devuelve). */
  tiene_clave_cifrada: boolean;
  /** El gateway puede resolver el secreto ahora mismo (descifrado o variable definida). */
  credencial_disponible: boolean;
  remitente_email: string;
  remitente_nombre?: string | null;
  parametros?: ParametrosCuenta | null;
}

export interface ICrearCuenta {
  proveedor: string;
  codigo: string;
  usuario?: string | null;
  secret_ref?: string | null;
  /** Texto plano: el gateway lo cifra (AES-256-GCM). Omitir para conservar el actual. */
  clave?: string;
  /** Solo actualización: borra la clave cifrada. */
  eliminar_clave?: boolean;
  remitente_email: string;
  remitente_nombre?: string | null;
  parametros?: ParametrosCuenta | null;
}

export type IActualizarCuenta = ICrearCuenta;

export interface IVerificacionCuenta {
  cuenta: string;
  proveedor: string;
  ok: boolean;
  detalle?: string;
  duracion_ms: number;
}
