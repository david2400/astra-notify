/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/shared/i18n/routing';
import type { ColumnDef } from '@tanstack/react-table';
import { HiOutlineChartBar, HiOutlineClock, HiOutlineDocumentDuplicate, HiOutlineEnvelope, HiOutlinePencilSquare } from 'react-icons/hi2';
import { DataTable } from '@repo/ui/table/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { cambiarEstadoPlantillaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/plantillas/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import { EstadoBadge } from '../../shared/components/estado-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { TablaAdmin } from '../../shared/components/tabla-admin';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import type { IPlantilla } from '../models/plantilla.interface';
import type { IEstadisticasEnvio } from '@/server/domains/administre/email/envios/types';
import { PlantillaEmailPreview } from './plantilla-preview';
import { VersionResumen } from './aprobacion-badge';

const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`);
const accion =
  'inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function PlantillaEmailManager({ initialData, estadisticas = [] }: { initialData: IPlantilla[]; estadisticas?: IEstadisticasEnvio[] }) {
  const porCodigo = useMemo(() => new Map(estadisticas.map((e) => [e.plantilla ?? '', e])), [estadisticas]);
  const router = useRouter();
  const [plantillas, setPlantillas] = useState(initialData);
  const [previsualizando, setPrevisualizando] = useState<IPlantilla | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => setPlantillas(initialData), [initialData]);

  const cambiarEstado = async (p: IPlantilla) => {
    const desactivar = !p.eliminado;
    if (!(await confirmar(desactivar ? `¿Desactivar ${p.codigo}?` : `¿Activar ${p.codigo}?`, desactivar ? 'Los envíos con esta plantilla responderán 422 PLANTILLA_NO_ENCONTRADA.' : undefined))) return;
    setProcesando(p.codigo);
    const r = await ejecutarAccion(() => cambiarEstadoPlantillaEmailServerAction(p.codigo, desactivar), {
      exito: desactivar ? 'Plantilla desactivada' : 'Plantilla activada',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesando(null);
    if (r) router.refresh();
  };

  const columns: ColumnDef<IPlantilla>[] = useMemo(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Plantilla',
        cell: ({ row }) => (
          <div className='space-y-0.5'>
            <p className='font-semibold text-foreground'>{row.original.codigo}</p>
            <p className='text-xs text-muted-foreground'>{row.original.nombre}</p>
          </div>
        ),
      },
      {
        accessorKey: 'asunto',
        header: 'Asunto',
        cell: ({ row }) => <span className='line-clamp-2 max-w-md font-mono text-xs text-muted-foreground'>{row.original.asunto}</span>,
      },
      {
        accessorKey: 'tipo_mensaje',
        header: 'Tipo',
        cell: ({ row }) =>
          row.original.tipo_mensaje ? <Badge variant='outline'>{row.original.tipo_mensaje}</Badge> : <span className='text-xs text-muted-foreground'>Del request</span>,
      },
      {
        id: 'envios',
        header: 'Envíos (30 días)',
        cell: ({ row }) => {
          const e = porCodigo.get(row.original.codigo);
          if (!e) return <span className='text-xs text-muted-foreground'>Sin envíos</span>;
          return (
            <div className='space-y-0.5 text-xs'>
              <p>
                <strong className='text-sm tabular-nums text-foreground'>{e.totales.enviados.toLocaleString('es-CO')}</strong> <span className='text-muted-foreground'>enviados</span>
              </p>
              <p className='text-muted-foreground'>
                Apertura <strong className='text-foreground'>{pct(e.tasas.apertura)}</strong> · Clic <strong className='text-foreground'>{pct(e.tasas.clic)}</strong>
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'version',
        header: 'Versión',
        cell: ({ row }) => <VersionResumen version={row.original.version} estado={row.original.estado_aprobacion} publicada={row.original.version_publicada} />,
      },
      {
        accessorKey: 'eliminado',
        header: 'Estado',
        cell: ({ row }) => <EstadoBadge eliminado={row.original.eliminado} />,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-2'>
            <Link href={`/administre/email/plantillas/${encodeURIComponent(row.original.codigo)}/editar`} className={accion}>
              <HiOutlinePencilSquare className='h-4 w-4' /> Editar
            </Link>
            <Link href={`/administre/email/plantillas/${encodeURIComponent(row.original.codigo)}/estadisticas`} className={accion}>
              <HiOutlineChartBar className='h-4 w-4' /> Seguimiento
            </Link>
            <Link href={`/administre/email/plantillas/${encodeURIComponent(row.original.codigo)}/versiones`} className={accion} title='Versiones, aprobación e historial'>
              <HiOutlineClock className='h-4 w-4' /> Versiones
            </Link>
            <Link href={`/administre/email/plantillas/nueva?desde=${encodeURIComponent(row.original.codigo)}`} className={accion} title='Duplicar plantilla'>
              <HiOutlineDocumentDuplicate className='h-4 w-4' /> Duplicar
            </Link>
            <Buttons size='sm' variant='outline' onClick={() => setPrevisualizando(row.original)}>
              Vista previa
            </Buttons>
            <Buttons
              size='sm'
              variant='ghost'
              loading={procesando === row.original.codigo}
              className={row.original.eliminado ? '' : 'text-destructive hover:text-destructive/80'}
              onClick={() => cambiarEstado(row.original)}>
              {row.original.eliminado ? 'Activar' : 'Desactivar'}
            </Buttons>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [procesando, porCodigo],
  );

  return (
    <section className='flex flex-col gap-6'>
      <ManagerHeader
        icon={<HiOutlineEnvelope className='h-6 w-6' />}
        title='Plantillas'
        description='Diseña correos con el editor de arrastrar y soltar o en HTML, con variables {{nombre}}. Revisa su seguimiento: entregas, aperturas y clics.'
        actionLabel='Nueva plantilla'
        onAction={() => router.push('/administre/email/plantillas/nueva')}
      />

      {plantillas.length === 0 ? (
        <EmptyState title='No hay plantillas' description='Crea una para enviar con "plantilla" y "variables" en el request.' />
      ) : (
        <TablaAdmin minWidth={1380}>
          <DataTable data={plantillas} columns={columns} className='py-2' />
        </TablaAdmin>
      )}

      <Modal
        size='xl'
        title={previsualizando ? `Vista previa de ${previsualizando.codigo}` : 'Vista previa'}
        open={previsualizando !== null}
        onOpenChange={(open) => !open && setPrevisualizando(null)}
        hideDefaultFooter>
        {previsualizando ? <PlantillaEmailPreview codigo={previsualizando.codigo} /> : null}
      </Modal>
    </section>
  );
}
