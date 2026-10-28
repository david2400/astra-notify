/** @format */

import type { Metadata } from 'next';
import { getTiposMensajeEmail } from '@/server/domains/administre/email/tipos-mensaje';
import { getPlantillasEmail } from '@/server/domains/administre/email/plantillas';
import { getProveedoresEmail } from '@/server/domains/administre/email/proveedores';
import { getCuentasEmail } from '@/server/domains/administre/email/cuentas';
import { EnviarCorreoScene } from '@/modules/notificaciones/correo';

export const metadata: Metadata = { title: 'Enviar correo' };

/** Catálogos de email_gateway para el formulario (si alguno falla, el formulario funciona con lo disponible). */
export default async function EnviarCorreoPage() {
  const [t, p, pr, c] = await Promise.allSettled([getTiposMensajeEmail(), getPlantillasEmail(), getProveedoresEmail(), getCuentasEmail()]);
  const fallidos = [t, p, pr, c].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  if (fallidos.length) console.error('[notificaciones/correo] catálogos', fallidos.map((f) => (f.reason as Error)?.message));

  const tipos = t.status === 'fulfilled' ? t.value.filter((x) => !x.eliminado) : [];
  const plantillas = p.status === 'fulfilled' ? p.value.filter((x) => !x.eliminado) : [];
  const proveedores = pr.status === 'fulfilled' ? pr.value.filter((x) => !x.eliminado && x.implementado) : [];
  const cuentas = c.status === 'fulfilled' ? c.value.filter((x) => !x.eliminado) : [];

  return (
    <EnviarCorreoScene
      tipos={tipos.map((x) => ({ codigo: x.codigo, descripcion: x.descripcion ?? null }))}
      plantillas={plantillas.map((x) => ({ codigo: x.codigo, nombre: x.nombre, asunto: x.asunto, tipo_mensaje: x.tipo_mensaje ?? null }))}
      proveedores={proveedores.map((x) => ({ codigo: x.codigo, nombre: x.nombre }))}
      cuentas={cuentas.map((x) => ({ codigo: x.codigo, proveedor: x.proveedor, remitente: x.remitente_email }))}
      errorCatalogos={fallidos.length ? ((fallidos[0]?.reason as Error)?.message ?? 'Error desconocido') : undefined}
    />
  );
}
