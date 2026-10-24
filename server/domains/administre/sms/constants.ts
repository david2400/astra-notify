/** Recursos de administración de sms_gateway (el prefijo /api/sms_gateway/v1/sms lo pone smsGatewayFetch). */
export const SMS_ADMIN = '/admin';

/** Las pantallas de administración siempre leen el estado actual: sin caché de Next. */
export const SIN_CACHE = { revalidate: 0 } as const;

/** Estado activo/inactivo de cualquier registro (soft delete: eliminado = true ⇒ inactivo). */
export interface IEstadoPayload {
  eliminado: boolean;
}
