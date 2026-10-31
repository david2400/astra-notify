/**
 * Plantillas de sms_gateway por el proxy de notificacion (smsGatewayFetch pone /api/notificacion/v1/gateway/sms).
 * Proveedores, cuentas, tipos de mensaje, servicios y rutas se administran en notificacion (smsAdminFetch).
 */
export const SMS_ADMIN = '/admin';

/** Las pantallas de administración siempre leen el estado actual: sin caché de Next. */
export const SIN_CACHE = { revalidate: 0 } as const;

/** Estado activo/inactivo de cualquier registro (soft delete: eliminado = true ⇒ inactivo). */
export interface IEstadoPayload {
  eliminado: boolean;
}
