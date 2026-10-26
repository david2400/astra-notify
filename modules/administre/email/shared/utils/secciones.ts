/** @format */

/** Módulos de la administración de email: pestañas, menú principal y tarjetas del resumen. */
export const EMAIL_ADMIN_SECCIONES = [
  { label: 'Resumen', href: '/administre/email', descripcion: 'Estado general de la configuración y de la cola.' },
  { label: 'Envíos', href: '/administre/email/envios', descripcion: 'Historial, detalle de intentos, cancelar, reintentar y envío de prueba.' },
  { label: 'Proveedores', href: '/administre/email/proveedores', descripcion: 'Gmail (SMTP), Brevo (API) y Mock, con sus timeouts.' },
  { label: 'Cuentas', href: '/administre/email/cuentas', descripcion: 'Remitente, credenciales cifradas, parámetros y prueba de conexión.' },
  { label: 'Tipos de mensaje', href: '/administre/email/tipos-mensaje', descripcion: 'Catálogo y prioridad en la cola (OTP, transaccional, masivo...).' },
  { label: 'Servicios', href: '/administre/email/servicios', descripcion: 'Qué tipos de mensaje atiende cada proveedor.' },
  { label: 'Rutas', href: '/administre/email/rutas', descripcion: 'Orden de cuentas, reintentos y fallback por tipo de mensaje.' },
  { label: 'Plantillas', href: '/administre/email/plantillas', descripcion: 'Asunto, HTML y texto con variables {{nombre}} y vista previa.' },
] as const;

/** Etiqueta de la ruta central (POST /v1/email/send). */
export const CENTRAL = 'CENTRAL';
