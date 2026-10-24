/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { HiOutlineArrowsRightLeft } from 'react-icons/hi2';
import { DataTable } from '@repo/ui/table/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import {
  cambiarEstadoRutaServerAction,
  eliminarRutaServerAction,
} from '@/app/[locale]/(protected)/administre/sms/rutas/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import type { ICuenta } from '@/server/domains/administre/sms/cuentas/types';
import type { IProveedor } from '@/server/domains/administre/sms/proveedores/types';
import type { ITipoMensaje } from '@/server/domains/administre/sms/tipos-mensaje/types';
import { EstadoBadge } from '../../shared/components/estado-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { TablaAdmin } from '../../shared/components/tabla-admin';
import { NativeSelect } from '../../shared/components/native-select';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import { CENTRAL, type IRuta } from '../models/ruta.interface';
import { RegisterRuta, UpdatePasos } from './form';
import { RutaEfectiva } from './ruta-efectiva';

interface Props {
  initialData: IRuta[];
  cuentas: ICuenta[];
  proveedores: IProveedor[];
  tipos: ITipoMensaje[];
}

export function RutaManager({ initialData, cuentas, proveedores, tipos }: Props) {
  const router = useRouter();
  const [rutas, setRutas] = useState(initialData);
  const [origen, setOrigen] = useState('');
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<IRuta | null>(null);
  const [viendo, setViendo] = useState<IRuta | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  useEffect(() => setRutas(initialData), [initialData]);

  const opcionesProveedor = useMemo(() => proveedores.map((p) => ({ value: String(p.id), label: p.codigo })), [proveedores]);
  const opcionesTipo = useMemo(() => tipos.map((t) => ({ value: String(t.id), label: t.codigo })), [tipos]);

  const filtradas = useMemo(() => {
    return rutas
      .filter((r) => !origen || r.proveedor_codigo === origen)
      .sort((a, b) => a.proveedor_codigo.localeCompare(b.proveedor_codigo) || a.tipo_mensaje.localeCompare(b.tipo_mensaje));
  }, [origen, rutas]);

  const eliminar = async (r: IRuta) => {
    if (!(await confirmar(`¿Eliminar la ruta ${r.proveedor_codigo} / ${r.tipo_mensaje}?`, 'Los envíos de ese tipo responderán 422 si no hay otra ruta.', 'Eliminar'))) return;
    setProcesandoId(r.id);
    const ok = await ejecutarAccion<unknown>(() => eliminarRutaServerAction(r.id), {
      exito: 'Ruta eliminada',
      error: 'No se pudo eliminar la ruta.',
    });
    setProcesandoId(null);
    if (ok !== null) router.refresh();
  };

  const cambiarEstado = async (r: IRuta) => {
    const desactivar = !r.eliminado;
    if (!(await confirmar(desactivar ? '¿Desactivar la ruta?' : '¿Activar la ruta?'))) return;
    setProcesandoId(r.id);
    const ok = await ejecutarAccion(() => cambiarEstadoRutaServerAction(r.id, desactivar), {
      exito: desactivar ? 'Ruta desactivada' : 'Ruta activada',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesandoId(null);
    if (ok) router.refresh();
  };

  const columns: ColumnDef<IRuta>[] = useMemo(
    () => [
      {
        accessorKey: 'proveedor_codigo',
        header: 'Ruta de',
        cell: ({ row }) =>
          row.original.proveedor_codigo === CENTRAL ? (
            <Badge variant='counter'>Central</Badge>
          ) : (
            <span className='font-semibold text-foreground'>{row.original.proveedor_codigo}</span>
          ),
      },
      {
        accessorKey: 'tipo_mensaje',
        header: 'Tipo',
        cell: ({ row }) => <Badge variant='outline'>{row.original.tipo_mensaje}</Badge>,
      },
      {
        id: 'pasos',
        // Texto para el buscador de la tabla: encontrar rutas por cuenta.
        accessorFn: (r) => r.pasos.map((p) => p.cuenta_codigo).join(' '),
        header: 'Pasos',
        cell: ({ row }) =>
          row.original.pasos.length === 0 ? (
            <span className='text-sm text-destructive'>Sin pasos</span>
          ) : (
            <ol className='space-y-0.5 text-sm'>
              {[...row.original.pasos]
                .sort((a, b) => a.orden - b.orden)
                .map((p) => (
                  <li key={p.orden}>
                    <span className='font-medium text-foreground'>
                      {p.orden}. {p.cuenta_codigo}
                    </span>{' '}
                    <span className='text-muted-foreground'>
                      ×{p.max_intentos} · {p.espera_ms} ms
                    </span>
                  </li>
                ))}
            </ol>
          ),
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
              Pasos
            </Buttons>
            <Buttons size='sm' variant='outline' onClick={() => setViendo(row.original)}>
              Ruta efectiva
            </Buttons>
            <Buttons size='sm' variant='ghost' loading={procesandoId === row.original.id} onClick={() => cambiarEstado(row.original)}>
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
        icon={<HiOutlineArrowsRightLeft className='h-6 w-6' />}
        title='Rutas'
        description='Por cada tipo de mensaje: qué cuentas se usan, en qué orden y con cuántos reintentos. La ruta CENTRAL atiende /v1/sms/send.'
        actionLabel='Nueva ruta'
        onAction={() => setCreando(true)}
        filters={
          <NativeSelect
            id='filtro-origen'
            label='Ruta de'
            placeholder='Todas'
            opciones={[{ value: CENTRAL, label: 'Central' }, ...proveedores.map((p) => ({ value: p.codigo, label: p.codigo }))]}
            value={origen}
            className='w-full md:w-60'
            onChange={(e) => setOrigen(e.target.value)}
          />
        }
      />

      {rutas.length === 0 ? (
        <EmptyState title='No hay rutas' description='Sin rutas el motor responde 422 RUTA_NO_CONFIGURADA a todos los envíos.' />
      ) : (
        <TablaAdmin minWidth={1050}>
          <DataTable data={filtradas} columns={columns} className='py-2' />
        </TablaAdmin>
      )}

      <Modal size='xl' title='Nueva ruta' open={creando} onOpenChange={setCreando} hideDefaultFooter>
        <RegisterRuta proveedores={opcionesProveedor} tipos={opcionesTipo} cuentas={cuentas} handleClose={() => setCreando(false)} />
      </Modal>
      <Modal
        size='xl'
        title={editando ? `Pasos de ${editando.proveedor_codigo} / ${editando.tipo_mensaje}` : 'Pasos'}
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        hideDefaultFooter>
        {editando ? <UpdatePasos ruta={editando} cuentas={cuentas} handleClose={() => setEditando(null)} /> : null}
      </Modal>
      <Modal
        size='lg'
        title={viendo ? `Ruta efectiva: ${viendo.proveedor_codigo} / ${viendo.tipo_mensaje}` : 'Ruta efectiva'}
        open={viendo !== null}
        onOpenChange={(open) => !open && setViendo(null)}
        hideDefaultFooter>
        {viendo ? <RutaEfectiva ruta={viendo} /> : null}
      </Modal>
    </section>
  );
}
