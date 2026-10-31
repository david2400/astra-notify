/**
 * Recursos de email_gateway por el proxy de notificacion: plantillas, historial y envío de prueba
 * (emailGatewayFetch pone /api/notificacion/v1/gateway/email).
 * Proveedores, cuentas, tipos de mensaje, servicios y rutas se administran en notificacion (emailAdminFetch).
 */
export const EMAIL_ADMIN = '/admin';
export const EMAIL_ENVIOS = '/email';

/** Las pantallas de administración siempre leen el estado actual: sin caché de Next. */
export const SIN_CACHE = { revalidate: 0 } as const;

/** Activo/inactivo (eliminado = true ⇒ inactivo). */
export interface IEstadoPayload {
  eliminado: boolean;
}

/** Auditoría que devuelve la administración. */
export interface IAuditoria {
  eliminado: boolean;
  usr_crea?: number;
  usr_mod?: number;
  created_at?: string;
  updated_at?: string;
}

export const cod = (codigo: string) => encodeURIComponent(codigo);
