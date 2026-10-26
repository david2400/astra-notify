/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { reemplazarServiciosEmailServerAction } from '@/app/[locale]/(protected)/administre/email/servicios/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import type { IProveedor } from '@/server/domains/administre/email/proveedores/types';
import type { ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje/types';
import { ManagerHeader } from '../../shared/components/manager-header';
import { NativeSelect } from '../../shared/components/native-select';
import { ejecutarAccion } from '../../shared/utils/feedback';

interface Props {
  proveedores: IProveedor[];
  tipos: ITipoMensaje[];
  /** Proveedor seleccionado (null si no hay proveedores). */
  proveedor: IProveedor | null;
}

/**
 * Tipos de mensaje que atiende cada proveedor. El motor rechaza con 422 SERVICIO_NO_SOPORTADO un envío
 * por un proveedor sin el servicio y lo omite del fallback.
 */
export function ServiciosEmailManager({ proveedores, tipos, proveedor }: Props) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(proveedor?.servicios ?? []));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => setSeleccion(new Set(proveedor?.servicios ?? [])), [proveedor]);

  const original = useMemo(() => [...(proveedor?.servicios ?? [])].sort().join(','), [proveedor]);
  const cambiado = [...seleccion].sort().join(',') !== original;

  const alternar = (codigo: string) =>
    setSeleccion((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(codigo)) siguiente.delete(codigo);
      else siguiente.add(codigo);
      return siguiente;
    });

  const guardar = async () => {
    if (!proveedor) return;
    setGuardando(true);
    const r = await ejecutarAccion(
      () => reemplazarServiciosEmailServerAction({ proveedor: proveedor.codigo, tipos_mensaje: [...seleccion] }),
      { exito: 'Servicios actualizados', error: 'No se pudieron guardar los servicios.' },
    );
    setGuardando(false);
    if (r) router.refresh();
  };

  return (
    <section className='flex flex-col gap-6'>
      <ManagerHeader
        icon={<HiOutlineAdjustmentsHorizontal className='h-6 w-6' />}
        title='Servicios por proveedor'
        description='Marca los tipos de mensaje que atiende cada proveedor. El fallback solo pasa por proveedores con el mismo servicio.'
        filters={
          <NativeSelect
            id='servicios-proveedor'
            label='Proveedor'
            opciones={proveedores.map((p) => ({ value: p.codigo, label: `${p.codigo} — ${p.nombre}` }))}
            value={proveedor?.codigo ?? ''}
            className='w-full md:w-80'
            onChange={(e) => router.push(`?proveedor=${e.target.value}`, { scroll: false })}
          />
        }
      />

      {!proveedor ? (
        <EmptyState title='No hay proveedores' description='Crea un proveedor para configurar sus servicios.' />
      ) : (
        <div className='rounded-2xl border border-border/60 bg-card p-6'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
            <p className='text-sm text-muted-foreground'>
              <span className='font-semibold text-foreground'>{proveedor.codigo}</span> atiende {seleccion.size} de {tipos.length} tipos.
            </p>
            {cambiado ? <Badge variant='secondary'>Cambios sin guardar</Badge> : null}
          </div>
          {proveedor.codigo === 'GMAIL' && seleccion.has('MASIVO') ? (
            <p className='mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm'>
              Gmail no es apto para masivos: ~500 destinatarios/día (cuenta personal) o 2000 (Workspace).
            </p>
          ) : null}
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {tipos.map((tipo) => {
              const marcado = seleccion.has(tipo.codigo);
              return (
                <label
                  key={tipo.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    marcado ? 'border-primary/60 bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}>
                  <input
                    type='checkbox'
                    className='mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]'
                    checked={marcado}
                    onChange={() => alternar(tipo.codigo)}
                    aria-label={tipo.codigo}
                  />
                  <span className='space-y-1'>
                    <span className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-foreground'>{tipo.codigo}</span>
                      <Badge variant='outline'>Prioridad {tipo.prioridad}</Badge>
                      {tipo.masivo ? <Badge variant='secondary'>Masivo</Badge> : null}
                      {tipo.eliminado ? <Badge variant='destructive'>Inactivo</Badge> : null}
                    </span>
                    <span className='block text-xs text-muted-foreground'>{tipo.descripcion || '--'}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className='mt-6 flex justify-end gap-3'>
            <Buttons variant='outline' disabled={!cambiado || guardando} onClick={() => setSeleccion(new Set(proveedor.servicios ?? []))}>
              Descartar
            </Buttons>
            <Buttons loading={guardando} disabled={!cambiado} onClick={guardar}>
              Guardar servicios
            </Buttons>
          </div>
        </div>
      )}
    </section>
  );
}
