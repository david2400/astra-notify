/** Contrato de PUT /admin/proveedores/{codigo}/servicios (la lectura viene en IProveedor.servicios). */
export interface IReemplazarServicios {
  proveedor: string;
  tipos_mensaje: string[];
}
