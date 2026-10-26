/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/shared/i18n/routing';
import type { ColumnDef } from '@tanstack/react-table';
import { HiOutlineEnvelope } from 'react-icons/hi2';
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
import { PlantillaEmailPreview } from './plantilla-preview';

export function PlantillaEmailManager({ initialData }: { initialData: IPlantilla[] }) {
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
      { accessorKey: 'version', header: 'Versión' },
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
            <Link
              href={`/administre/email/plantillas/${encodeURIComponent(row.original.codigo)}/editar`}
              className='inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              Editar
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
    [procesando],
  );

  return (
    <section className='flex flex-col gap-6'>
      <ManagerHeader
        icon={<HiOutlineEnvelope className='h-6 w-6' />}
        title='Plantillas'
        description='Asunto, HTML y texto con variables {{nombre}}. El gateway valida tipos, obligatorias, longitud y patrón, y escapa los valores en el HTML.'
        actionLabel='Nueva plantilla'
        onAction={() => router.push('/administre/email/plantillas/nueva')}
      />

      {plantillas.length === 0 ? (
        <EmptyState title='No hay plantillas' description='Crea una para enviar con "plantilla" y "variables" en el request.' />
      ) : (
        <TablaAdmin minWidth={1050}>
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
