/** @format */

'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Label } from '@repo/ui/label/scenes/label';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { ESTADOS_ENTREGA, ESTADOS_ENVIO, PROVEEDORES_ENVIO, type IFiltroEnvios } from '../models/envio.interface';

/** datetime-local (hora local) ↔ ISO UTC que espera el gateway. */
const aLocal = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const aIso = (local: string) => (local ? new Date(local).toISOString() : '');

/** Filtros del historial: se reflejan en la URL (?estado=...&page=0) y los aplica la página en el servidor. */
export function FiltrosEnvios({ filtro, tipos }: { filtro: IFiltroEnvios; tipos: OpcionSelect[] }) {
  const router = useRouter();
  const [v, setV] = useState({
    destino: filtro.destino ?? '',
    estado: filtro.estado ?? '',
    estado_entrega: filtro.estado_entrega ?? '',
    tipo_mensaje: filtro.tipo_mensaje ?? '',
    proveedor: filtro.proveedor ?? '',
    lote_id: filtro.lote_id ?? '',
    desde: aLocal(filtro.desde),
    hasta: aLocal(filtro.hasta),
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));

  const aplicar = (e?: FormEvent) => {
    e?.preventDefault();
    const q = new URLSearchParams();
    const valores = { ...v, desde: aIso(v.desde), hasta: aIso(v.hasta) };
    for (const [k, val] of Object.entries(valores)) if (val.trim()) q.set(k, val.trim());
    if (filtro.size && filtro.size !== 20) q.set('size', String(filtro.size));
    router.push(`?${q.toString()}`, { scroll: false });
  };

  return (
    <form onSubmit={aplicar} className='grid grid-cols-12 gap-3 rounded-2xl border border-border/60 bg-card p-4'>
      <div className='col-span-12 space-y-1.5 md:col-span-4'>
        <Label htmlFor='f-destino'>Destinatario</Label>
        <Input id='f-destino' type='email' placeholder='cliente@correo.com' value={v.destino} onChange={set('destino')} />
      </div>
      <NativeSelect id='f-estado' label='Estado' placeholder='Todos' opciones={ESTADOS_ENVIO} value={v.estado} onChange={set('estado')} className='col-span-6 md:col-span-2' />
      <NativeSelect id='f-entrega' label='Entrega' placeholder='Todas' opciones={ESTADOS_ENTREGA} value={v.estado_entrega} onChange={set('estado_entrega')} className='col-span-6 md:col-span-2' />
      <NativeSelect id='f-tipo' label='Tipo' placeholder='Todos' opciones={tipos} value={v.tipo_mensaje} onChange={set('tipo_mensaje')} className='col-span-6 md:col-span-2' />
      <NativeSelect id='f-proveedor' label='Proveedor' placeholder='Todos' opciones={PROVEEDORES_ENVIO} value={v.proveedor} onChange={set('proveedor')} className='col-span-6 md:col-span-2' />
      <div className='col-span-12 space-y-1.5 md:col-span-4'>
        <Label htmlFor='f-lote'>Lote</Label>
        <Input id='f-lote' placeholder='lote_id' value={v.lote_id} onChange={set('lote_id')} />
      </div>
      <div className='col-span-6 space-y-1.5 md:col-span-3'>
        <Label htmlFor='f-desde'>Desde</Label>
        <Input id='f-desde' type='datetime-local' value={v.desde} onChange={set('desde')} />
      </div>
      <div className='col-span-6 space-y-1.5 md:col-span-3'>
        <Label htmlFor='f-hasta'>Hasta</Label>
        <Input id='f-hasta' type='datetime-local' value={v.hasta} onChange={set('hasta')} />
      </div>
      <div className='col-span-12 flex items-end gap-2 md:col-span-2'>
        <Buttons type='submit' className='flex-1'>Filtrar</Buttons>
        <Buttons type='button' variant='outline' onClick={() => router.push('?', { scroll: false })}>Limpiar</Buttons>
      </div>
    </form>
  );
}
