/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { HiOutlineTag } from 'react-icons/hi2';
import { DataTable } from '@repo/ui/table/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import {
  cambiarEstadoTipoMensajeServerAction,
  eliminarTipoMensajeServerAction,
} from '@/app/[locale]/(protected)/administre/sms/tipos-mensaje/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import { EstadoBadge, SiNoBadge } from '../../shared/components/estado-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { TablaAdmin } from '../../shared/components/tabla-admin';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import type { ITipoMensaje } from '../models/tipo-mensaje.interface';
import { RegisterTipoMensaje, UpdateTipoMensaje } from './form';

export function TipoMensajeManager({ initialData }: { initialData: ITipoMensaje[] }) {
  const router = useRouter();
  const [tipos, setTipos] = useState(initialData);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<ITipoMensaje | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  useEffect(() => setTipos(initialData), [initialData]);


  const ejecutar = async (id: number, accion: () => ReturnType<typeof eliminarTipoMensajeServerAction>, exito: string, error: string) => {
    setProcesandoId(id);
    const r = await ejecutarAccion<unknown>(accion, { exito, error });
    setProcesandoId(null);
    if (r !== null) router.refresh();
  };

  const eliminar = async (t: ITipoMensaje) => {
    if (!(await confirmar(`¿Eliminar el tipo ${t.codigo}?`, 'Si lo usan rutas, servicios o plantillas el gateway lo rechazará.', 'Eliminar'))) return;
    await ejecutar(t.id, () => eliminarTipoMensajeServerAction(t.id), 'Tipo de mensaje eliminado', 'No se pudo eliminar.');
  };

  const cambiarEstado = async (t: ITipoMensaje) => {
    const desactivar = !t.eliminado;
    if (!(await confirmar(desactivar ? `¿Desactivar ${t.codigo}?` : `¿Activar ${t.codigo}?`))) return;
    setProcesandoId(t.id);
    const r = await ejecutarAccion(() => cambiarEstadoTipoMensajeServerAction(t.id, desactivar), {
      exito: desactivar ? 'Tipo desactivado' : 'Tipo activado',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesandoId(null);
    if (r) router.refresh();
  };

  const columns: ColumnDef<ITipoMensaje>[] = useMemo(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        cell: ({ row }) => <span className='font-semibold text-foreground'>{row.original.codigo}</span>,
      },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => (
          <span className='line-clamp-2 text-sm text-muted-foreground'>{row.original.descripcion || '--'}</span>
        ),
      },
      {
        accessorKey: 'canal',
        header: 'Canal',
        cell: ({ row }) => <Badge variant='outline'>{row.original.canal}</Badge>,
      },
      { accessorKey: 'otp', header: 'OTP', cell: ({ row }) => <SiNoBadge valor={row.original.otp} /> },
      { accessorKey: 'masivo', header: 'Masivo', cell: ({ row }) => <SiNoBadge valor={row.original.masivo} /> },
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
            <Buttons size='sm' variant='outline' onClick={() => setEditando(row.original)}>
              Editar
            </Buttons>
            <Buttons
              size='sm'
              variant='ghost'
              loading={procesandoId === row.original.id}
              onClick={() => cambiarEstado(row.original)}>
              {row.original.eliminado ? 'Activar' : 'Desactivar'}
            </Buttons>
            <Buttons
              size='sm'
              variant='ghost'
              className='text-destructive hover:text-destructive/80'
              disabled={procesandoId === row.original.id}
              onClick={() => eliminar(row.original)}>
              Eliminar
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
        icon={<HiOutlineTag className='h-6 w-6' />}
        title='Tipos de mensaje'
        description='Catálogo que usan las rutas, los servicios por proveedor y el campo tipo_mensaje de los envíos.'
        actionLabel='Nuevo tipo'
        onAction={() => setCreando(true)}
      />

      {tipos.length === 0 ? (
        <EmptyState title='No hay tipos de mensaje' description='Crea al menos OTP y NORMAL para empezar.' />
      ) : (
        <TablaAdmin minWidth={1000}>
          <DataTable data={tipos} columns={columns} className='py-2' />
        </TablaAdmin>
      )}

      <Modal size='md' title='Nuevo tipo de mensaje' open={creando} onOpenChange={setCreando} hideDefaultFooter>
        <RegisterTipoMensaje handleClose={() => setCreando(false)} />
      </Modal>
      <Modal
        size='md'
        title={editando ? `Editar ${editando.codigo}` : 'Editar tipo'}
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        hideDefaultFooter>
        {editando ? <UpdateTipoMensaje tipo={editando} handleClose={() => setEditando(null)} /> : null}
      </Modal>
    </section>
  );
}
