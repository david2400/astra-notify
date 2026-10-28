/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { buscarEnviosSms, type IPaginaSms } from '@/server/domains/notificaciones/sms';
import { getTiposMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import { getProveedores } from '@/server/domains/administre/sms/proveedores';
import { filtroSmsSchema, HistorialSmsScene } from '@/modules/notificaciones/envios';
import { ErrorCarga } from '@/modules/notificaciones/shared';

export const metadata: Metadata = { title: 'Historial de notificaciones' };

/** Historial de SMS (sms_gateway). Los filtros llegan por la URL. */
export default async function HistorialSmsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await searchParams;
  const plano = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const filtro = filtroSmsSchema.parse(plano);

  let pagina: IPaginaSms;
  const [r, t, pr] = await Promise.allSettled([buscarEnviosSms(filtro), getTiposMensaje(), getProveedores()]);
  try {
    if (r.status === 'rejected') throw r.reason;
    pagina = r.value;
  } catch (e) {
    unstable_rethrow(e);
    console.error('[notificaciones/envios]', e);
    return <ErrorCarga recurso='los envíos de SMS' gateway='sms_gateway' detalle={(e as Error).message} />;
  }
  const tipos = t.status === 'fulfilled' ? t.value.filter((x) => !x.eliminado).map((x) => ({ value: x.codigo, label: x.codigo })) : [];
  const proveedores = pr.status === 'fulfilled' ? pr.value.filter((x) => !x.eliminado).map((x) => ({ value: x.codigo, label: x.nombre })) : [];

  return <HistorialSmsScene pagina={pagina} filtro={filtro} tipos={tipos} proveedores={proveedores} />;
}
