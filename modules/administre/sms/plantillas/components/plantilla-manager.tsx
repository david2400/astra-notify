/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/shared/i18n/routing';
import type { ColumnDef } from '@tanstack/react-table';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import { DataTable } from '@repo/ui/table/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { cambiarEstadoPlantillaServerAction } from '@/app/[locale]/(protected)/administre/sms/plantillas/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import { EstadoBadge } from '../../shared/components/estado-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { TablaAdmin } from '../../shared/components/tabla-admin';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import type { IPlantilla } from '../models/plantilla.interface';
import { PlantillaPreview } from './plantilla-preview';

export function PlantillaManager({ initialData }: { initialData: IPlantilla[] }) {
  const router = useRouter();
  const [plantillas, setPlantillas] = useState(initialData);
  const [previsualizando, setPrevisualizando] = useState<IPlantilla | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  useEffect(() => setPlantillas(initialData), [initialData]);

  const cambiarEstado = async (p: IPlantilla) => {
    const desactivar = !p.eliminado;
    if (!(await confirmar(desactivar ? `¿Desactivar ${p.codigo}?` : `¿Activar ${p.codigo}?`, desactivar ? 'Los envíos con esta plantilla responderán 422.' : undefined))) return;
    setProcesandoId(p.id);
    const r = await ejecutarAccion(() => cambiarEstadoPlantillaServerAction(p.id, desactivar), {
      exito: desactivar ? 'Plantilla desactivada' : 'Plantilla activada',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesandoId(null);
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
        accessorKey: 'contenido',
        header: 'Contenido',
        cell: ({ row }) => <span className='line-clamp-2 max-w-md text-sm text-muted-foreground'>{row.original.contenido}</span>,
      },
      {
        accessorKey: 'tipo_mensaje',
        header: 'Tipo',
        cell: ({ row }) => (row.original.tipo_mensaje ? <Badge variant='outline'>{row.original.tipo_mensaje}</Badge> : <span className='text-xs text-muted-foreground'>Del request</span>),
      },
      {
        id: 'variables',
        header: 'Variables',
        cell: ({ row }) => <span className='text-sm'>{row.original.variables.length}</span>,
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
            <Link href={`/administre/sms/plantillas/${row.original.id}/editar`} className='inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              Editar
            </Link>
            <Buttons size='sm' variant='outline' onClick={() => setPrevisualizando(row.original)}>
              Previsualizar
            </Buttons>
            <Buttons
              size='sm'
              variant='ghost'
              loading={procesandoId === row.original.id}
              className={row.original.eliminado ? '' : 'text-destructive hover:text-destructive/80'}
              onClick={() => cambiarEstado(row.original)}>
              {row.original.eliminado ? 'Activar' : 'Desactivar'}
            </Buttons>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [procesandoId],
  );

  return (
    <section className='flex flex-col gap-6'>
      <ManagerHeader
        icon={<HiOutlineDocumentText className='h-6 w-6' />}
        title='Plantillas'
        description='Textos con variables {{nombre}}. El gateway valida tipos, obligatorias y longitud antes de enviar.'
        actionLabel='Nueva plantilla'
        onAction={() => router.push('/administre/sms/plantillas/nueva')}
      />

      {plantillas.length === 0 ? (
        <EmptyState title='No hay plantillas' description='Crea una para enviar con "plantilla" y "variables" en el request.' />
      ) : (
        <TablaAdmin minWidth={1100}>
          <DataTable data={plantillas} columns={columns} className='py-2' />
        </TablaAdmin>
      )}

      <Modal
        size='lg'
        title={previsualizando ? `Previsualizar ${previsualizando.codigo}` : 'Previsualizar'}
        open={previsualizando !== null}
        onOpenChange={(open) => !open && setPrevisualizando(null)}
        hideDefaultFooter>
        {previsualizando ? <PlantillaPreview plantilla={previsualizando} /> : null}
      </Modal>
    </section>
  );
}
