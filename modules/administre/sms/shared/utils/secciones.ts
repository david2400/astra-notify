/** @format */

/** Módulos de la administración SMS: pestañas, menú principal y tarjetas del resumen. */
export const SMS_ADMIN_SECCIONES = [
  { label: 'Resumen', href: '/administre/sms', descripcion: 'Estado general de la configuración.' },
  { label: 'Proveedores', href: '/administre/sms/proveedores', descripcion: 'Integraciones (Inalambria, Go4Clients, Mock) y sus timeouts.' },
  { label: 'Cuentas', href: '/administre/sms/cuentas', descripcion: 'Credenciales, remitente y parámetros de cada proveedor.' },
  { label: 'Tipos de mensaje', href: '/administre/sms/tipos-mensaje', descripcion: 'Catálogo: OTP, masivo, WhatsApp, plantilla...' },
  { label: 'Servicios', href: '/administre/sms/servicios', descripcion: 'Qué tipos de mensaje atiende cada proveedor.' },
  { label: 'Rutas', href: '/administre/sms/rutas', descripcion: 'Orden de cuentas, reintentos y respaldo por tipo de mensaje.' },
  { label: 'Plantillas', href: '/administre/sms/plantillas', descripcion: 'Textos con variables {{nombre}} y su previsualización.' },
] as const;
