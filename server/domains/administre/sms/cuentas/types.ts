/** Cuenta de SMS (notificacion: /api/notificacion/v1/admin/sms/cuentas). */
export type ParametrosCuenta = Record<string, unknown>;

export interface ICuenta {
  id: number;
  proveedor_id: number;
  proveedor_codigo: string;
  codigo: string;
  /** Usuario o api key; 'env:VARIABLE' se lee del entorno del gateway. */
  usuario: string | null;
  /** Variable de entorno con la contraseña (alternativa a la clave cifrada). */
  secret_ref: string | null;
  /** null: notificacion no puede verificarlo (la variable de secret_ref vive en el entorno de sms_gateway). */
  secret_definido: boolean | null;
  /** true si hay clave cifrada guardada (el valor nunca se devuelve). */
  clave_configurada: boolean;
  /** Usuario + clave descifrable con la llave del gateway, o secret_ref definido. */
  credencial_disponible: boolean;
  remitente: string | null;
  parametros: ParametrosCuenta | null;
  /** Ids de las rutas que usan la cuenta. */
  rutas: number[];
  eliminado: boolean;
}

export interface ICrearCuenta {
  proveedor_id: number;
  codigo: string;
  usuario?: string | null;
  secret_ref?: string | null;
  /** Texto plano; notificacion la guarda cifrada (AES-256-GCM, llave de sms_gateway). Omitir para conservar la actual. */
  clave?: string;
  remitente?: string | null;
  parametros?: ParametrosCuenta | null;
}

export interface IActualizarCuenta extends ICrearCuenta {
  id: number;
}

export interface IFiltroCuentas {
  proveedor_id?: number;
}
