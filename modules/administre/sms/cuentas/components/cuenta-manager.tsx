/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { HiOutlineKey } from 'react-icons/hi2';
import { DataTable } from '@repo/ui/table/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { cambiarEstadoCuentaServerAction } from '@/app/[locale]/(protected)/administre/sms/cuentas/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import type { IProveedor } from '@/server/domains/administre/sms/proveedores/types';
import { EstadoBadge } from '../../shared/components/estado-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { TablaAdmin } from '../../shared/components/tabla-admin';
import { NativeSelect } from '../../shared/components/native-select';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import type { ICuenta } from '../models/cuenta.interface';
import { RegisterCuenta, UpdateCuenta } from './form';

interface Props {
  initialData: ICuenta[];
  proveedores: IProveedor[];
  /** Filtro activo (?proveedor=). */
  proveedorId?: number;
}

/** Cómo resuelve la cuenta su contraseña: clave cifrada, variable de entorno o nada. */
function Credenciales({ cuenta }: { cuenta: ICuenta }) {
  if (cuenta.clave_configurada) return <Badge variant='default'>Clave cifrada</Badge>;
  if (cuenta.secret_ref) {
    // secret_definido null: notificacion no ve el entorno de sms_gateway (la variable debe existir allá)
    return cuenta.secret_definido === false ? (
      <Badge variant='destructive'>Falta env {cuenta.secret_ref}</Badge>
    ) : (
      <Badge variant='secondary' title='Variable de entorno de sms_gateway'>Env: {cuenta.secret_ref}</Badge>
    );
  }
  return <Badge variant='destructive'>Sin clave</Badge>;
}

export function CuentaManager({ initialData, proveedores, proveedorId }: Props) {
  const router = useRouter();
  const [cuentas, setCuentas] = useState(initialData);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<ICuenta | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  useEffect(() => setCuentas(initialData), [initialData]);

  const opcionesProveedor = useMemo(
    () => proveedores.map((p) => ({ value: String(p.id), label: `${p.codigo} — ${p.nombre}` })),
    [proveedores],
  );


  const cambiarEstado = async (c: ICuenta) => {
    const desactivar = !c.eliminado;
    const ok = await confirmar(
      desactivar ? `¿Desactivar ${c.codigo}?` : `¿Activar ${c.codigo}?`,
      desactivar && c.rutas.length ? `La usan ${c.rutas.length} ruta(s): el motor la saltará.` : undefined,
    );
    if (!ok) return;
    setProcesandoId(c.id);
    const r = await ejecutarAccion(() => cambiarEstadoCuentaServerAction(c.id, desactivar), {
      exito: desactivar ? 'Cuenta desactivada' : 'Cuenta activada',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesandoId(null);
    if (r) router.refresh();
  };

  const columns: ColumnDef<ICuenta>[] = useMemo(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Cuenta',
        cell: ({ row }) => (
          <div className='space-y-0.5'>
            <p className='font-semibold text-foreground'>{row.original.codigo}</p>
            <p className='text-xs text-muted-foreground'>{row.original.proveedor_codigo}</p>
          </div>
        ),
      },
      {
        accessorKey: 'usuario',
        header: 'Usuario',
        cell: ({ row }) => <span className='text-sm'>{row.original.usuario || '--'}</span>,
      },
      {
        id: 'credenciales',
        header: 'Credenciales',
        cell: ({ row }) => <Credenciales cuenta={row.original} />,
      },
      {
        accessorKey: 'remitente',
        header: 'Remitente',
        cell: ({ row }) => <span className='text-sm'>{row.original.remitente || '--'}</span>,
      },
      {
        id: 'rutas',
        header: 'Rutas',
        cell: ({ row }) => <span className='text-sm'>{row.original.rutas.length}</span>,
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
          <div className='flex gap-2'>
            <Buttons size='sm' variant='outline' onClick={() => setEditando(row.original)}>
              Editar
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
        icon={<HiOutlineKey className='h-6 w-6' />}
        title='Cuentas'
        description='Credenciales, remitente y parámetros con los que se envía por cada proveedor.'
        actionLabel='Nueva cuenta'
        onAction={() => setCreando(true)}
        filters={
          <NativeSelect
            id='filtro-proveedor'
            label='Proveedor'
            placeholder='Todos'
            opciones={opcionesProveedor}
            value={proveedorId ? String(proveedorId) : ''}
            className='w-full md:w-72'
            onChange={(e) =>
              router.push(e.target.value ? `?proveedor=${e.target.value}` : '?', { scroll: false })
            }
          />
        }
      />

      {cuentas.length === 0 ? (
        <EmptyState title='No hay cuentas' description='Registra una cuenta para poder usarla en las rutas.' />
      ) : (
        <TablaAdmin minWidth={1150}>
          <DataTable data={cuentas} columns={columns} className='py-2' />
        </TablaAdmin>
      )}

      <Modal size='lg' title='Nueva cuenta' open={creando} onOpenChange={setCreando} hideDefaultFooter>
        <RegisterCuenta proveedores={opcionesProveedor} proveedorId={proveedorId} handleClose={() => setCreando(false)} />
      </Modal>
      <Modal
        size='lg'
        title={editando ? `Editar ${editando.codigo}` : 'Editar cuenta'}
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        hideDefaultFooter>
        {editando ? (
          <UpdateCuenta cuenta={editando} proveedores={opcionesProveedor} handleClose={() => setEditando(null)} />
        ) : null}
      </Modal>
    </section>
  );
}
