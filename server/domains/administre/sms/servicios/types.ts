/** Tipos de mensaje que atiende cada proveedor (notificacion: /admin/sms/proveedores/{codigo}/servicios). */
export interface IServiciosProveedor {
  proveedor_id: number;
  proveedor_codigo: string;
  /** Códigos de tipos de mensaje (CanalTipoMensaje, canal SMS) habilitados. */
  tipos_mensaje: string[];
}

export interface IReemplazarServicios {
  proveedor_id: number;
  tipos_mensaje: string[];
}
