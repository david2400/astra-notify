/** Contrato de /admin/proveedores/{id}/servicios: tipos de mensaje que atiende cada proveedor. */
export interface IServiciosProveedor {
  proveedor_id: number;
  proveedor_codigo: string;
  /** Códigos de SmsTipoMensaje habilitados. */
  tipos_mensaje: string[];
}

export interface IReemplazarServicios {
  proveedor_id: number;
  tipos_mensaje: string[];
}
