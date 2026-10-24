/**
 * Centralized cache tag definitions for on-demand revalidation.
 *
 * Convention:  `domain:entity`  or  `domain:entity:id`
 * Usage:       revalidateTag(smsAdminTags.proveedores())
 */

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authTags = {
  session: () => 'auth:session' as const,
  user: (id: number | string) => `auth:user:${id}` as const,
} as const;

// ─── Administración SMS (sms_gateway) ───────────────────────────────────────
export const smsAdminTags = {
  proveedores: () => 'sms-admin:proveedores' as const,
  cuentas: () => 'sms-admin:cuentas' as const,
  tiposMensaje: () => 'sms-admin:tipos-mensaje' as const,
  servicios: (proveedorId: number | string) => `sms-admin:servicios:${proveedorId}` as const,
  rutas: () => 'sms-admin:rutas' as const,
  plantillas: () => 'sms-admin:plantillas' as const,
} as const;
