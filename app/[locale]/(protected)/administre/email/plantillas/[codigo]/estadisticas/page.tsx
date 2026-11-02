import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import { Link } from '@/shared/i18n/routing';
import { ServerApiError } from '@/server/lib/types';
import { getPlantillaEmail } from '@/server/domains/administre/email/plantillas';
import { getTiposMensajeEmail, type ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje';
import { buscarEnviosEmail, getEstadisticasEmail, type IFiltroEnvios } from '@/server/domains/administre/email/envios';
import { ErrorCarga } from '@/modules/administre/email/shared';
import { periodo, SeguimientoPlantilla, TZ_OFFSET } from '@/modules/administre/email/seguimiento';

export const metadata: Metadata = { title: 'Seguimiento de plantilla' };

type Params = Partial<Record<keyof IFiltroEnvios, string>>;

/** Seguimiento de una plantilla: métricas del periodo + historial de sus envíos (filtrable). */
export default async function EstadisticasPlantillaEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string; locale: string }>;
  searchParams: Promise<Params>;
}) {
  const { codigo } = await params;
  const valor = decodeURIComponent(codigo);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/.test(valor)) notFound();
  const p = await searchParams;
  const filtro: IFiltroEnvios = {
    plantilla: valor,
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
  try {
    const [plantilla, estadisticas, pagina, tipos] = await Promise.all([
      getPlantillaEmail(valor),
      getEstadisticasEmail({ plantilla: valor, ...periodo(30), tz_offset: TZ_OFFSET }),
      buscarEnviosEmail(filtro),
      getTiposMensajeEmail().catch(() => [] as ITipoMensaje[]),
    ]);
    return <SeguimientoPlantilla plantilla={plantilla} estadisticas={estadisticas} pagina={pagina} filtro={filtro} tipos={tipos} />;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ServerApiError && error.status === 404) notFound();
    return (
      <div className='space-y-4'>
        <Link href='/administre/email/plantillas' className='text-sm font-medium underline'>
          Volver a plantillas
        </Link>
        <ErrorCarga recurso='el seguimiento de la plantilla' detalle={error instanceof Error ? error.message : 'No se pudo cargar.'} />
      </div>
    );
  }
}
