/** Contrato de /admin/cuentas (CuentaRequest / CuentaResponse). */
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
  /** true si la variable de secret_ref existe en el servidor del gateway. */
  secret_definido: boolean;
  /** true si hay clave cifrada guardada (el valor nunca se devuelve). */
  clave_configurada: boolean;
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
  /** Texto plano; el gateway la guarda cifrada (AES-256). Omitir para conservar la actual. */
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
