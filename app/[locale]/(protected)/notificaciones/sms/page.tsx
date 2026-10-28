/** @format */

import type { Metadata } from 'next';
import { getTiposMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import { getPlantillas } from '@/server/domains/administre/sms/plantillas';
import { getProveedores } from '@/server/domains/administre/sms/proveedores';
import { getCuentas } from '@/server/domains/administre/sms/cuentas';
import { EnviarSmsScene } from '@/modules/notificaciones/sms';

export const metadata: Metadata = { title: 'Enviar SMS' };

/** Catálogos de sms_gateway para el formulario (si alguno falla, el formulario funciona con lo disponible). */
export default async function EnviarSmsPage() {
  const [t, p, pr, c] = await Promise.allSettled([getTiposMensaje(), getPlantillas(), getProveedores(), getCuentas()]);
  const fallidos = [t, p, pr, c].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  if (fallidos.length) console.error('[notificaciones/sms] catálogos', fallidos.map((f) => (f.reason as Error)?.message));

  const tipos = t.status === 'fulfilled' ? t.value.filter((x) => !x.eliminado && x.canal === 'SMS') : [];
  const codigosSms = new Set(tipos.map((x) => x.codigo));
  const plantillas =
    p.status === 'fulfilled' ? p.value.filter((x) => !x.eliminado && (!x.tipo_mensaje || codigosSms.size === 0 || codigosSms.has(x.tipo_mensaje))) : [];
  const proveedores = pr.status === 'fulfilled' ? pr.value.filter((x) => !x.eliminado && x.implementado) : [];
  const cuentas = c.status === 'fulfilled' ? c.value.filter((x) => !x.eliminado) : [];

  return (
    <EnviarSmsScene
      tipos={tipos.map((x) => ({ codigo: x.codigo, descripcion: x.descripcion, masivo: x.masivo, otp: x.otp }))}
      plantillas={plantillas.map((x) => ({ codigo: x.codigo, nombre: x.nombre, contenido: x.contenido, tipo_mensaje: x.tipo_mensaje, variables: x.variables }))}
      proveedores={proveedores.map((x) => ({ codigo: x.codigo, nombre: x.nombre }))}
      cuentas={cuentas.map((x) => ({ codigo: x.codigo, proveedor: x.proveedor_codigo, remitente: x.remitente }))}
      errorCatalogos={fallidos.length ? ((fallidos[0]?.reason as Error)?.message ?? 'Error desconocido') : undefined}
    />
  );
}
