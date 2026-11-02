/** @format */

'use client';

import { HiOutlineArrowLeft, HiOutlineDocumentDuplicate, HiOutlinePencilSquare } from 'react-icons/hi2';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { Link } from '@/shared/i18n/routing';
import type { IPlantilla } from '@/server/domains/administre/email/plantillas/types';
import type { ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje/types';
import type { IEnvio, IEstadisticasEnvio, IFiltroEnvios, IPagina } from '@/server/domains/administre/email/envios/types';
import { EnvioEmailManager } from '../../envios/components/envio-manager';
import { EstadoBadge } from '../../shared/components/estado-badge';
import { PanelEstadisticas } from './panel-estadisticas';

const enlace =
  'inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface Props {
  plantilla: IPlantilla;
  estadisticas: IEstadisticasEnvio;
  pagina: IPagina<IEnvio>;
  filtro: IFiltroEnvios;
  tipos: ITipoMensaje[];
}

/** Página de seguimiento de una plantilla (como el reporte de una campaña en Brevo). */
export function SeguimientoPlantilla({ plantilla, estadisticas, pagina, filtro, tipos }: Props) {
  const codigo = encodeURIComponent(plantilla.codigo);
  return (
    <section className='mx-auto flex w-full max-w-[1500px] flex-col gap-8'>
      <Link
        href='/administre/email/plantillas'
        className='inline-flex w-fit items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
        <HiOutlineArrowLeft className='h-4 w-4' aria-hidden='true' />
        Volver a plantillas
      </Link>
      <header className='flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between'>
        <div className='space-y-2'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>Administración Email / Plantillas / Seguimiento</p>
          <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>{plantilla.nombre}</h1>
          <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <span className='font-mono'>{plantilla.codigo}</span>
            <Badge variant='outline'>Versión {plantilla.version}</Badge>
            {plantilla.tipo_mensaje ? <Badge variant='outline'>{plantilla.tipo_mensaje}</Badge> : null}
            <EstadoBadge eliminado={plantilla.eliminado} />
          </div>
          <p className='text-sm text-muted-foreground'>
            Asunto: <span className='text-foreground'>{plantilla.asunto}</span>
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Link href={`/administre/email/plantillas/${codigo}/editar`} className={enlace}>
            <HiOutlinePencilSquare className='h-4 w-4' /> Editar
          </Link>
          <Link href={`/administre/email/plantillas/nueva?desde=${codigo}`} className={enlace}>
            <HiOutlineDocumentDuplicate className='h-4 w-4' /> Duplicar
          </Link>
        </div>
      </header>

      <PanelEstadisticas inicial={estadisticas} plantilla={plantilla.codigo} />

      <section className='space-y-4'>
        <div>
          <h2 className='text-xl font-semibold tracking-tight text-foreground'>Correos enviados con esta plantilla</h2>
          <p className='text-sm text-muted-foreground'>Abre un correo para ver su línea de tiempo (entregado, abierto, clic…) y el contenido exacto que recibió el destinatario.</p>
        </div>
        <EnvioEmailManager pagina={pagina} filtro={filtro} tipos={tipos} plantillas={[plantilla]} mostrarPrueba={false} plantillaFija={plantilla.codigo} />
      </section>
    </section>
  );
}
