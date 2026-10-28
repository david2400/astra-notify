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
import { cambiarEstadoTipoMensajeEmailServerAction } from '@/app/[locale]/(protected)/administre/email/tipos-mensaje/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import { EstadoBadge, SiNoBadge } from '../../shared/components/estado-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { TablaAdmin } from '../../shared/components/tabla-admin';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import type { ITipoMensaje } from '../models/tipo-mensaje.interface';
import { RegisterTipoMensaje, UpdateTipoMensaje } from './form';

export function TipoMensajeEmailManager({ initialData }: { initialData: ITipoMensaje[] }) {
  const router = useRouter();
  const [tipos, setTipos] = useState(initialData);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<ITipoMensaje | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => setTipos(initialData), [initialData]);

  const cambiarEstado = async (t: ITipoMensaje) => {
    const desactivar = !t.eliminado;
    if (!(await confirmar(desactivar ? `¿Desactivar ${t.codigo}?` : `¿Activar ${t.codigo}?`, desactivar ? 'Los envíos de este tipo responderán 422 TIPO_MENSAJE_NO_VALIDO.' : undefined))) return;
    setProcesando(t.codigo);
    const r = await ejecutarAccion(() => cambiarEstadoTipoMensajeEmailServerAction(t.codigo, desactivar), {
      exito: desactivar ? 'Tipo desactivado' : 'Tipo activado',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesando(null);
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
        cell: ({ row }) => <span className='line-clamp-2 text-sm text-muted-foreground'>{row.original.descripcion || '--'}</span>,
      },
      {
        accessorKey: 'prioridad',
        header: 'Prioridad',
        cell: ({ row }) => (
          <Badge variant={row.original.prioridad <= 2 ? 'default' : row.original.prioridad >= 8 ? 'outline' : 'secondary'}>
            {row.original.prioridad}
          </Badge>
        ),
      },
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
        icon={<HiOutlineTag className='h-6 w-6' />}
        title='Tipos de mensaje'
        description='Catálogo que usan rutas, servicios y el campo tipo_mensaje de los envíos. La prioridad ordena la cola (1 sale primero).'
        actionLabel='Nuevo tipo'
        onAction={() => setCreando(true)}
      />

      {tipos.length === 0 ? (
        <EmptyState title='No hay tipos de mensaje' description='Ejecuta admin_canales_datos.sql de notificacion o crea OTP y TRANSACCIONAL.' />
      ) : (
        <TablaAdmin minWidth={900}>
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
