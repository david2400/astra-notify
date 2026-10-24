/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { HiOutlineServerStack } from 'react-icons/hi2';
import { DataTable } from '@repo/ui/table/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Link } from '@/shared/i18n/routing';
import { cambiarEstadoProveedorServerAction } from '@/app/[locale]/(protected)/administre/sms/proveedores/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import { EstadoBadge, SiNoBadge } from '../../shared/components/estado-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { TablaAdmin } from '../../shared/components/tabla-admin';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import type { IProveedor } from '../models/proveedor.interface';
import { RegisterProveedor, UpdateProveedor } from './form';

interface Props {
  initialData: IProveedor[];
  implementados: string[];
}

export function ProveedorManager({ initialData, implementados }: Props) {
  const router = useRouter();
  const [proveedores, setProveedores] = useState(initialData);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<IProveedor | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  useEffect(() => setProveedores(initialData), [initialData]);


  const cambiarEstado = async (p: IProveedor) => {
    const desactivar = !p.eliminado;
    const ok = await confirmar(
      desactivar ? `¿Desactivar ${p.codigo}?` : `¿Activar ${p.codigo}?`,
      desactivar ? 'Sus cuentas dejarán de usarse en las rutas.' : undefined,
    );
    if (!ok) return;
    setProcesandoId(p.id);
    const r = await ejecutarAccion(() => cambiarEstadoProveedorServerAction(p.id, desactivar), {
      exito: desactivar ? 'Proveedor desactivado' : 'Proveedor activado',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesandoId(null);
    if (r) router.refresh();
  };

  const columns: ColumnDef<IProveedor>[] = useMemo(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Proveedor',
        cell: ({ row }) => (
          <div className='space-y-0.5'>
            <p className='font-semibold text-foreground'>{row.original.codigo}</p>
            <p className='text-xs text-muted-foreground'>{row.original.nombre}</p>
          </div>
        ),
      },
      {
        accessorKey: 'base_url',
        header: 'URL base',
        cell: ({ row }) => <span className='break-all text-sm text-muted-foreground'>{row.original.base_url}</span>,
      },
      {
        id: 'timeouts',
        header: 'Timeouts (ms)',
        cell: ({ row }) => (
          <span className='text-sm'>
            {row.original.connect_timeout_ms} / {row.original.read_timeout_ms}
          </span>
        ),
      },
      {
        accessorKey: 'implementado',
        header: 'Módulo',
        cell: ({ row }) => <SiNoBadge valor={row.original.implementado} si='Implementado' no='Sin módulo' />,
      },
      { accessorKey: 'cuentas', header: 'Cuentas' },
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
            <Buttons size='sm' variant='outline' asChild>
              <Link href={`/administre/sms/servicios?proveedor=${row.original.id}`}>Servicios</Link>
            </Buttons>
            <Buttons size='sm' variant='outline' asChild>
              <Link href={`/administre/sms/cuentas?proveedor=${row.original.id}`}>Cuentas</Link>
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
        icon={<HiOutlineServerStack className='h-6 w-6' />}
        title='Proveedores'
        description='Integraciones de envío y sus timeouts. Cada proveedor necesita un módulo en sms_gateway.'
        actionLabel='Nuevo proveedor'
        onAction={() => setCreando(true)}
      />

      {proveedores.length === 0 ? (
        <EmptyState title='No hay proveedores' description='Crea el primero para poder registrar cuentas y rutas.' />
      ) : (
        <TablaAdmin minWidth={1100}>
          <DataTable data={proveedores} columns={columns} className='py-2' />
        </TablaAdmin>
      )}

      <Modal size='md' title='Nuevo proveedor' open={creando} onOpenChange={setCreando} hideDefaultFooter>
        <RegisterProveedor implementados={implementados} handleClose={() => setCreando(false)} />
      </Modal>
      <Modal
        size='md'
        title={editando ? `Editar ${editando.codigo}` : 'Editar proveedor'}
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        hideDefaultFooter>
        {editando ? (
          <UpdateProveedor proveedor={editando} implementados={implementados} handleClose={() => setEditando(null)} />
        ) : null}
      </Modal>
    </section>
  );
}
