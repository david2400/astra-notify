/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { reemplazarServiciosServerAction } from '@/app/[locale]/(protected)/administre/sms/servicios/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import type { IProveedor } from '@/server/domains/administre/sms/proveedores/types';
import type { ITipoMensaje } from '@/server/domains/administre/sms/tipos-mensaje/types';
import { ManagerHeader } from '../../shared/components/manager-header';
import { NativeSelect } from '../../shared/components/native-select';
import { ejecutarAccion } from '../../shared/utils/feedback';
import type { IServiciosProveedor } from '../models/servicio.interface';

interface Props {
  proveedores: IProveedor[];
  tipos: ITipoMensaje[];
  /** Servicios del proveedor seleccionado (null si no hay proveedores). */
  servicios: IServiciosProveedor | null;
}

/**
 * Tipos de mensaje que atiende cada proveedor. El motor rechaza con 422 SERVICIO_NO_SOPORTADO un
 * envío de un tipo que el proveedor no tiene y lo salta en el fallback.
 */
export function ServiciosManager({ proveedores, tipos, servicios }: Props) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(servicios?.tipos_mensaje ?? []));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => setSeleccion(new Set(servicios?.tipos_mensaje ?? [])), [servicios]);

  const original = useMemo(() => [...(servicios?.tipos_mensaje ?? [])].sort().join(','), [servicios]);
  const cambiado = [...seleccion].sort().join(',') !== original;

  const alternar = (codigo: string) =>
    setSeleccion((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(codigo)) siguiente.delete(codigo);
      else siguiente.add(codigo);
      return siguiente;
    });

  const guardar = async () => {
    if (!servicios) return;
    setGuardando(true);
    const r = await ejecutarAccion(
      () => reemplazarServiciosServerAction({ proveedor_id: servicios.proveedor_id, tipos_mensaje: [...seleccion] }),
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
        description='Marca los tipos de mensaje que atiende cada proveedor. Quitar uno que usan sus rutas no está permitido.'
        filters={
          <NativeSelect
            id='servicios-proveedor'
            label='Proveedor'
            opciones={proveedores.map((p) => ({ value: String(p.id), label: `${p.codigo} — ${p.nombre}` }))}
            value={servicios ? String(servicios.proveedor_id) : ''}
            className='w-full md:w-80'
            onChange={(e) => router.push(`?proveedor=${e.target.value}`, { scroll: false })}
          />
        }
      />

      {!servicios ? (
        <EmptyState title='No hay proveedores' description='Crea un proveedor para configurar sus servicios.' />
      ) : (
        <div className='rounded-2xl border border-border/60 bg-card p-6'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
            <p className='text-sm text-muted-foreground'>
              <span className='font-semibold text-foreground'>{servicios.proveedor_codigo}</span> atiende{' '}
              {seleccion.size} de {tipos.length} tipos.
            </p>
            {cambiado ? <Badge variant='secondary'>Cambios sin guardar</Badge> : null}
          </div>
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
                      <Badge variant='outline'>{tipo.canal}</Badge>
                      {tipo.eliminado ? <Badge variant='destructive'>Inactivo</Badge> : null}
                    </span>
                    <span className='block text-xs text-muted-foreground'>{tipo.descripcion || '--'}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className='mt-6 flex justify-end gap-3'>
            <Buttons
              variant='outline'
              disabled={!cambiado || guardando}
              onClick={() => setSeleccion(new Set(servicios.tipos_mensaje))}>
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
