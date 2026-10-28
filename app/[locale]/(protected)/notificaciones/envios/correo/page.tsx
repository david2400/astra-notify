/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { buscarEnviosEmail, type IEnvio, type IFiltroEnvios, type IPagina } from '@/server/domains/administre/email/envios';
import { getTiposMensajeEmail, type ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje';
import { EnvioEmailManager } from '@/modules/administre/email/envios';
import { ErrorCarga } from '@/modules/notificaciones/shared';

export const metadata: Metadata = { title: 'Historial de correos' };

type Params = Partial<Record<keyof IFiltroEnvios, string>>;

/** Historial de correos (email_gateway): reutiliza la tabla de Administración Email sin el envío de prueba. */
export default async function HistorialCorreoPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const filtro: IFiltroEnvios = {
    destino: p.destino || undefined,
    estado: p.estado || undefined,
    estado_entrega: p.estado_entrega || undefined,
    tipo_mensaje: p.tipo_mensaje || undefined,
    proveedor: p.proveedor || undefined,
    lote_id: p.lote_id || undefined,
    desde: p.desde || undefined,
    hasta: p.hasta || undefined,
    page: Math.max(0, Number(p.page) || 0),
    size: Math.min(100, Math.max(5, Number(p.size) || 20)),
  };
  let pagina: IPagina<IEnvio>;
  let tipos: ITipoMensaje[] = [];
  try {
    const [r, t] = await Promise.allSettled([buscarEnviosEmail(filtro), getTiposMensajeEmail()]);
    if (r.status === 'rejected') throw r.reason;
    pagina = r.value;
    tipos = t.status === 'fulfilled' ? t.value : [];
  } catch (e) {
    unstable_rethrow(e);
    console.error('[notificaciones/envios/correo]', e);
    return <ErrorCarga recurso='los envíos de correo' gateway='email_gateway' detalle={(e as Error).message} />;
  }
  return <EnvioEmailManager pagina={pagina} filtro={filtro} tipos={tipos} plantillas={[]} mostrarPrueba={false} />;
}
