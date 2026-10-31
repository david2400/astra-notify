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
import Swal from 'sweetalert2';
import { cambiarCodigoRutaEmailServerAction, cambiarEstadoRutaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/rutas/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import type { ICuenta } from '@/server/domains/administre/email/cuentas/types';
import type { IProveedor } from '@/server/domains/administre/email/proveedores/types';
import type { ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje/types';
import { EstadoBadge } from '../../shared/components/estado-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { TablaAdmin } from '../../shared/components/tabla-admin';
import { NativeSelect } from '../../shared/components/native-select';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import { CENTRAL, type IRuta } from '../models/ruta.interface';
import { codigoRutaSchema } from '../schemas/ruta.schema';
import { RegisterRuta, UpdatePasos } from './form';
import { RutaEfectiva } from './ruta-efectiva';

interface Props {
  initialData: IRuta[];
  cuentas: ICuenta[];
  proveedores: IProveedor[];
  tipos: ITipoMensaje[];
}

const origenDe = (r: IRuta) => r.proveedor ?? CENTRAL;

export function RutaEmailManager({ initialData, cuentas, proveedores, tipos }: Props) {
  const router = useRouter();
  const [rutas, setRutas] = useState(initialData);
  const [origen, setOrigen] = useState('');
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<IRuta | null>(null);
  const [viendo, setViendo] = useState<IRuta | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  useEffect(() => setRutas(initialData), [initialData]);

  const opcionesProveedor = useMemo(() => proveedores.map((p) => ({ value: p.codigo, label: p.codigo })), [proveedores]);
  const opcionesTipo = useMemo(() => tipos.map((t) => ({ value: t.codigo, label: t.codigo })), [tipos]);
  const opcionesCuenta = useMemo(() => cuentas.map((c) => ({ value: c.codigo, label: `${c.codigo} (${c.proveedor})` })), [cuentas]);
  const sinCredenciales = useMemo(
    () => new Set(cuentas.filter((c) => !c.credencial_disponible && c.proveedor !== 'MOCK').map((c) => c.codigo)),
    [cuentas],
  );

  const filtradas = useMemo(
    () =>
      rutas
        .filter((r) => !origen || origenDe(r) === origen)
        .sort((a, b) => (a.proveedor ? 1 : 0) - (b.proveedor ? 1 : 0) || origenDe(a).localeCompare(origenDe(b)) || a.tipo_mensaje.localeCompare(b.tipo_mensaje)),
    [origen, rutas],
  );

  /** Código para pedir la ruta en el envío (campo `ruta`); vacío lo quita. */
  const cambiarCodigo = async (r: IRuta) => {
    const { value, isConfirmed } = await Swal.fire({
      title: `Código de la ruta ${origenDe(r)} / ${r.tipo_mensaje}`,
      text: 'Se usa en el campo "ruta" del envío (también sirve el id ' + r.id + '). Déjalo vacío para quitarlo.',
      input: 'text',
      inputValue: r.codigo ?? '',
      inputPlaceholder: 'OTP_PRIORITARIA',
      inputAttributes: { maxlength: '50', autocapitalize: 'characters' },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (v) => {
        const r2 = codigoRutaSchema.safeParse(v ?? '');
        return r2.success ? null : (r2.error.issues[0]?.message ?? 'Código inválido');
      },
    });
    if (!isConfirmed) return;
    const codigo = String(value ?? '').trim().toUpperCase() || null;
    if (codigo === (r.codigo ?? null)) return;
    setProcesandoId(r.id);
    const ok = await ejecutarAccion(() => cambiarCodigoRutaEmailServerAction(r.id, codigo), {
      exito: codigo ? `Código ${codigo} guardado` : 'Código quitado',
      error: 'No se pudo cambiar el código.',
    });
    setProcesandoId(null);
    if (ok) router.refresh();
  };

  const cambiarEstado = async (r: IRuta) => {
    const desactivar = !r.eliminado;
    if (!(await confirmar(desactivar ? '¿Desactivar la ruta?' : '¿Activar la ruta?', desactivar ? 'Los envíos de ese tipo responderán 422 RUTA_NO_CONFIGURADA.' : undefined))) return;
    setProcesandoId(r.id);
    const ok = await ejecutarAccion(() => cambiarEstadoRutaEmailServerAction(r.id, desactivar), {
      exito: desactivar ? 'Ruta desactivada' : 'Ruta activada',
      error: 'No se pudo cambiar el estado.',
    });
    setProcesandoId(null);
    if (ok) router.refresh();
  };

  const columns: ColumnDef<IRuta>[] = useMemo(
    () => [
      {
        id: 'origen',
        accessorFn: origenDe,
        header: 'Ruta de',
        cell: ({ row }) =>
          row.original.proveedor ? (
            <span className='font-semibold text-foreground'>{row.original.proveedor}</span>
          ) : (
            <Badge variant='counter'>Central</Badge>
          ),
      },
      {
        id: 'codigo',
        accessorFn: (r) => r.codigo ?? '',
        header: 'Código',
        cell: ({ row }) =>
          row.original.codigo ? (
            <span className='font-mono text-xs font-semibold text-foreground'>{row.original.codigo}</span>
          ) : (
            <span className='text-xs text-muted-foreground'>id {row.original.id}</span>
          ),
      },
      {
        accessorKey: 'tipo_mensaje',
        header: 'Tipo',
        cell: ({ row }) => <Badge variant='outline'>{row.original.tipo_mensaje}</Badge>,
      },
      {
        id: 'pasos',
        accessorFn: (r) => r.pasos.map((p) => p.cuenta).join(' '),
        header: 'Pasos (fallback)',
        cell: ({ row }) =>
          row.original.pasos.length === 0 ? (
            <span className='text-sm text-destructive'>Sin pasos</span>
          ) : (
            <ol className='space-y-0.5 text-sm'>
              {[...row.original.pasos]
                .sort((a, b) => a.orden - b.orden)
                .map((p) => (
                  <li key={p.orden} className={p.activo ? '' : 'opacity-60'}>
                    <span className='font-medium text-foreground'>
                      {p.orden}. {p.cuenta}
                    </span>{' '}
                    <span className='text-muted-foreground'>
                      ({p.proveedor}) ×{p.max_intentos} · {p.espera_ms} ms
                    </span>
                    {!p.activo ? <span className='ml-1 text-xs text-destructive'>inactiva</span> : null}
                    {p.activo && sinCredenciales.has(p.cuenta) ? <span className='ml-1 text-xs text-destructive'>sin credenciales</span> : null}
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
            <Buttons size='sm' variant='outline' disabled={procesandoId === row.original.id} onClick={() => cambiarCodigo(row.original)}>
              Código
            </Buttons>
            <Buttons size='sm' variant='outline' onClick={() => setViendo(row.original)}>
              Simular
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
    [procesandoId, sinCredenciales],
  );

  return (
    <section className='flex flex-col gap-6'>
      <ManagerHeader
        icon={<HiOutlineArrowsRightLeft className='h-6 w-6' />}
        title='Rutas'
        description='Por tipo de mensaje: qué cuentas se usan, en qué orden y con cuántos reintentos. La ruta CENTRAL atiende /v1/email/send; las de proveedor, /v1/email/proveedores/{proveedor}/send.'
        actionLabel='Nueva ruta'
        onAction={() => setCreando(true)}
        filters={
          <NativeSelect
            id='filtro-origen'
            label='Ruta de'
            placeholder='Todas'
            opciones={[{ value: CENTRAL, label: 'Central' }, ...opcionesProveedor]}
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
        title={editando ? `Pasos de ${origenDe(editando)} / ${editando.tipo_mensaje}` : 'Pasos'}
        open={editando !== null}
        onOpenChange={(open) => !open && setEditando(null)}
        hideDefaultFooter>
        {editando ? <UpdatePasos ruta={editando} cuentas={cuentas} handleClose={() => setEditando(null)} /> : null}
      </Modal>
      <Modal
        size='lg'
        title={viendo ? `Simular ${origenDe(viendo)} / ${viendo.tipo_mensaje}` : 'Simular'}
        open={viendo !== null}
        onOpenChange={(open) => !open && setViendo(null)}
        hideDefaultFooter>
        {viendo ? <RutaEfectiva ruta={viendo} proveedores={opcionesProveedor} cuentas={opcionesCuenta} /> : null}
      </Modal>
    </section>
  );
}
