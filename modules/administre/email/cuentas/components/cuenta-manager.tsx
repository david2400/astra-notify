/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import Swal from 'sweetalert2';
import { HiOutlineKey } from 'react-icons/hi2';
import { DataTable } from '@repo/ui/table/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { cambiarEstadoCuentaEmailServerAction, probarCuentaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/cuentas/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import type { IProveedor } from '@/server/domains/administre/email/proveedores/types';
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
  /** Filtro activo (?proveedor=CODIGO). */
  proveedor?: string;
}

/** Cómo resuelve la cuenta su secreto: clave cifrada, variable de entorno o nada. */
function Credenciales({ cuenta }: { cuenta: ICuenta }) {
  if (cuenta.proveedor === 'MOCK') return <Badge variant='outline'>No requiere</Badge>;
  if (cuenta.tiene_clave_cifrada) {
    return cuenta.credencial_disponible ? <Badge variant='default'>Clave cifrada</Badge> : <Badge variant='destructive'>No se puede descifrar</Badge>;
  }
  if (cuenta.secret_ref) {
    return cuenta.credencial_disponible ? (
      <Badge variant='secondary'>Env: {cuenta.secret_ref}</Badge>
    ) : (
      <Badge variant='destructive'>Falta env {cuenta.secret_ref}</Badge>
    );
  }
  return <Badge variant='destructive'>Sin clave</Badge>;
}

export function CuentaEmailManager({ initialData, proveedores, proveedor }: Props) {
  const router = useRouter();
  const [cuentas, setCuentas] = useState(initialData);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<ICuenta | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => setCuentas(initialData), [initialData]);

  const opcionesProveedor = useMemo(
    () => proveedores.map((p) => ({ value: p.codigo, label: `${p.codigo} — ${p.nombre}` })),
    [proveedores],
  );

  const cambiarEstado = async (c: ICuenta) => {
    const desactivar = !c.eliminado;
    const ok = await confirmar(
      desactivar ? `¿Desactivar ${c.codigo}?` : `¿Activar ${c.codigo}?`,
      desactivar ? 'Las rutas que la usan la saltarán (fallback al siguiente paso).' : undefined,
    );
    if (!ok) return;
    setProcesando(c.codigo);
    const r = await ejecutarAccion(() => cambiarEstadoCuentaEmailServerAction(c.codigo, desactivar), {
      exito: desactivar ? 'Cuenta desactivada' : 'Cuenta activada',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesando(null);
    if (r) router.refresh();
  };

  const probar = async (c: ICuenta) => {
    setProcesando(c.codigo);
    const r = await probarCuentaEmailServerAction(c.codigo);
    setProcesando(null);
    if (!r.success) {
      await Swal.fire({ title: 'Error', text: r.error, icon: 'error' });
      return;
    }
    await Swal.fire({
      title: r.data.ok ? 'Conexión correcta' : 'La prueba falló',
      text: `${r.data.detalle ?? ''} (${r.data.duracion_ms} ms)`,
      icon: r.data.ok ? 'success' : 'error',
    });
  };

  const columns: ColumnDef<ICuenta>[] = useMemo(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Cuenta',
        cell: ({ row }) => (
          <div className='space-y-0.5'>
            <p className='font-semibold text-foreground'>{row.original.codigo}</p>
            <p className='text-xs text-muted-foreground'>{row.original.proveedor}</p>
          </div>
        ),
      },
      {
        accessorKey: 'remitente_email',
        header: 'Remitente',
        cell: ({ row }) => (
          <div className='space-y-0.5 text-sm'>
            <p className={/CAMBIAR/i.test(row.original.remitente_email) ? 'text-destructive' : ''}>{row.original.remitente_email}</p>
            {row.original.remitente_nombre ? <p className='text-xs text-muted-foreground'>{row.original.remitente_nombre}</p> : null}
          </div>
        ),
      },
      {
        id: 'auth',
        header: 'Autenticación',
        cell: ({ row }) => {
          const modo = (row.original.parametros as Record<string, unknown> | null | undefined)?.authMode;
          return row.original.proveedor === 'GMAIL' ? (
            <Badge variant='outline'>{modo === 'OAUTH2' ? 'OAuth2' : 'App password'}</Badge>
          ) : (
            <span className='text-xs text-muted-foreground'>{row.original.proveedor === 'BREVO' ? 'API key' : '--'}</span>
          );
        },
      },
      {
        id: 'credenciales',
        header: 'Credenciales',
        cell: ({ row }) => <Credenciales cuenta={row.original} />,
      },
      {
        id: 'limites',
        header: 'Límites',
        cell: ({ row }) => {
          const p = (row.original.parametros ?? {}) as Record<string, unknown>;
          const partes = [
            p.dailyLimit ? `${p.dailyLimit}/día` : null,
            p.rateLimitPerSecond ? `${p.rateLimitPerSecond}/s` : p.rateLimitPerMinute ? `${p.rateLimitPerMinute}/min` : null,
            p.batchSize ? `lote ${p.batchSize}` : null,
            p.sandbox === true || p.sandbox === 'true' ? 'sandbox' : null,
          ].filter(Boolean);
          return <span className='text-xs text-muted-foreground'>{partes.join(' · ') || '--'}</span>;
        },
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
            <Buttons size='sm' variant='outline' onClick={() => setEditando(row.original)}>
              Editar
            </Buttons>
            <Buttons size='sm' variant='outline' loading={procesando === row.original.codigo} onClick={() => probar(row.original)}>
              Probar conexión
            </Buttons>
            <Buttons
              size='sm'
              variant='ghost'
              disabled={procesando === row.original.codigo}
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
        icon={<HiOutlineKey className='h-6 w-6' />}
        title='Cuentas'
        description='Remitente, credenciales (cifradas o por variable de entorno) y parámetros con los que se envía por cada proveedor.'
        actionLabel='Nueva cuenta'
        onAction={() => setCreando(true)}
        filters={
          <NativeSelect
            id='filtro-proveedor'
            label='Proveedor'
            placeholder='Todos'
            opciones={opcionesProveedor}
            value={proveedor ?? ''}
            className='w-full md:w-72'
            onChange={(e) => router.push(e.target.value ? `?proveedor=${e.target.value}` : '?', { scroll: false })}
          />
        }
      />

      {cuentas.length === 0 ? (
        <EmptyState title='No hay cuentas' description='Registra una cuenta para poder usarla en las rutas.' />
      ) : (
        <TablaAdmin minWidth={1200}>
          <DataTable data={cuentas} columns={columns} className='py-2' />
        </TablaAdmin>
      )}

      <Modal size='lg' title='Nueva cuenta' open={creando} onOpenChange={setCreando} hideDefaultFooter>
        <RegisterCuenta proveedores={opcionesProveedor} proveedor={proveedor} handleClose={() => setCreando(false)} />
      </Modal>
      <Modal
        size='lg'
        title={editando ? `Editar ${editando.codigo}` : 'Editar cuenta'}
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        hideDefaultFooter>
        {editando ? <UpdateCuenta cuenta={editando} proveedores={opcionesProveedor} handleClose={() => setEditando(null)} /> : null}
      </Modal>
    </section>
  );
}
