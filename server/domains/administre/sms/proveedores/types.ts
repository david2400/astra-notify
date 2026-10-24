/** Contrato de /admin/proveedores (ProveedorRequest / ProveedorResponse). */
export interface IProveedor {
  id: number;
  codigo: string;
  nombre: string;
  base_url: string;
  connect_timeout_ms: number;
  read_timeout_ms: number;
  eliminado: boolean;
  /** true si existe un módulo que implementa el proveedor en sms_gateway. */
  implementado: boolean;
  /** Cantidad de cuentas registradas. */
  cuentas: number;
  fecha_creacion?: string | null;
}

export interface ICrearProveedor {
  codigo: string;
  nombre: string;
  base_url: string;
  connect_timeout_ms?: number;
  read_timeout_ms?: number;
}

export interface IActualizarProveedor extends ICrearProveedor {
  id: number;
}
