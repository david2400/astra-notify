/** @format */

export const NOTIFICACIONES_SECCIONES = [
  { label: 'Enviar SMS', href: '/notificaciones/sms', descripcion: 'A un número o masivo (lista o CSV), con texto libre o plantilla.' },
  { label: 'Enviar correo', href: '/notificaciones/correo', descripcion: 'A uno o varios destinatarios o masivo, con adjuntos y envío programado.' },
  { label: 'Historial', href: '/notificaciones/envios', descripcion: 'Envíos de SMS y correo con su estado, intentos y entrega.' },
] as const;
