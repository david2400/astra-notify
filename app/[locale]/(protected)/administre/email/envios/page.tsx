/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { buscarEnviosEmail, type IEnvio, type IFiltroEnvios, type IPagina } from '@/server/domains/administre/email/envios';
import { getTiposMensajeEmail, type ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje';
import { getPlantillasEmail, type IPlantilla } from '@/server/domains/administre/email/plantillas';
import { EnvioEmailManager } from '@/modules/administre/email/envios';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Envíos de email' };

type Params = Partial<Record<keyof IFiltroEnvios, string>>;

export default async function EnviosEmailPage({ searchParams }: { searchParams: Promise<Params> }) {
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
  let plantillas: IPlantilla[] = [];
  try {
    const [r, t, pl] = await Promise.allSettled([buscarEnviosEmail(filtro), getTiposMensajeEmail(), getPlantillasEmail()]);
    if (r.status === 'rejected') throw r.reason;
    pagina = r.value;
    tipos = t.status === 'fulfilled' ? t.value : [];
    plantillas = pl.status === 'fulfilled' ? pl.value : [];
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/envios]', e);
    return <ErrorCarga recurso='los envíos' detalle={(e as Error).message} />;
  }
  return <EnvioEmailManager pagina={pagina} filtro={filtro} tipos={tipos} plantillas={plantillas} />;
}
