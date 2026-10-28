/** @format */

'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Label } from '@repo/ui/label/scenes/label';
import { NativeSelect, type OpcionSelect } from '@/modules/administre/email/shared';
import { ESTADOS_SMS } from '../models/envio.interface';
import type { FiltroSms } from '../schemas/filtro-envios.schemas';

/** Filtros del historial de SMS: se reflejan en la URL y los aplica la página en el servidor. */
export function FiltrosSms({ filtro, tipos, proveedores }: { filtro: FiltroSms; tipos: OpcionSelect[]; proveedores: OpcionSelect[] }) {
  const router = useRouter();
  const [v, setV] = useState({
    destino: filtro.destino ?? '',
    estado: filtro.estado ?? '',
    tipo_mensaje: filtro.tipo_mensaje ?? '',
    proveedor: filtro.proveedor ?? '',
    desde: filtro.desde?.slice(0, 16) ?? '',
    hasta: filtro.hasta?.slice(0, 16) ?? '',
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));

  const aplicar = (e?: FormEvent) => {
    e?.preventDefault();
    const q = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) if (val.trim()) q.set(k, val.trim());
    if (filtro.size !== 20) q.set('size', String(filtro.size));
    router.push(`?${q.toString()}`, { scroll: false });
  };

  return (
    <form onSubmit={aplicar} className='grid grid-cols-12 gap-3 rounded-2xl border border-border/60 bg-card p-4'>
      <div className='col-span-12 space-y-1.5 md:col-span-3'>
        <Label htmlFor='fs-destino'>Celular</Label>
        <Input id='fs-destino' inputMode='tel' placeholder='3001234567' value={v.destino} onChange={set('destino')} />
      </div>
      <NativeSelect id='fs-estado' label='Estado' placeholder='Todos' opciones={ESTADOS_SMS} value={v.estado} onChange={set('estado')} className='col-span-6 md:col-span-3' />
      <NativeSelect id='fs-tipo' label='Tipo' placeholder='Todos' opciones={tipos} value={v.tipo_mensaje} onChange={set('tipo_mensaje')} className='col-span-6 md:col-span-3' />
      <NativeSelect id='fs-proveedor' label='Proveedor' placeholder='Todos' opciones={proveedores} value={v.proveedor} onChange={set('proveedor')} className='col-span-6 md:col-span-3' />
      <div className='col-span-6 space-y-1.5 md:col-span-4'>
        <Label htmlFor='fs-desde'>Desde</Label>
        <Input id='fs-desde' type='datetime-local' value={v.desde} onChange={set('desde')} />
      </div>
      <div className='col-span-6 space-y-1.5 md:col-span-4'>
        <Label htmlFor='fs-hasta'>Hasta</Label>
        <Input id='fs-hasta' type='datetime-local' value={v.hasta} onChange={set('hasta')} />
      </div>
      <div className='col-span-12 flex items-end gap-2 md:col-span-4'>
        <Buttons type='submit' className='flex-1'>Filtrar</Buttons>
        <Buttons type='button' variant='outline' onClick={() => router.push('?', { scroll: false })}>Limpiar</Buttons>
      </div>
    </form>
  );
}
