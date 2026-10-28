/** @format */

'use client';

import { useRef } from 'react';
import { HiOutlinePaperClip, HiOutlineXMark } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { tamano } from '../../shared';
import { LIMITES_CORREO } from '../models/correo.interface';

interface Props {
  archivos: File[];
  onChange: (archivos: File[]) => void;
  onError: (mensaje: string) => void;
}

/** Adjuntos desde el navegador: se validan los límites del gateway y se codifican en Base64 al enviar. */
export function Adjuntos({ archivos, onChange, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const total = archivos.reduce((s, a) => s + a.size, 0);

  const agregar = (lista: FileList | null) => {
    if (!lista?.length) return;
    const nuevos = [...archivos];
    let acumulado = total;
    for (const f of Array.from(lista)) {
      if (f.size === 0) {
        onError(`${f.name} está vacío.`);
        continue;
      }
      if (f.size > LIMITES_CORREO.adjuntoBytes) {
        onError(`${f.name} supera ${tamano(LIMITES_CORREO.adjuntoBytes)} por adjunto.`);
        continue;
      }
      if (acumulado + f.size > LIMITES_CORREO.adjuntosTotalBytes) {
        onError(`Los adjuntos superan ${tamano(LIMITES_CORREO.adjuntosTotalBytes)} en total.`);
        break;
      }
      if (nuevos.some((n) => n.name === f.name && n.size === f.size)) continue;
      nuevos.push(f);
      acumulado += f.size;
    }
    onChange(nuevos);
  };

  return (
    <div className='space-y-2'>
      <input
        ref={input}
        type='file'
        multiple
        className='hidden'
        aria-label='Adjuntos'
        data-testid='input-adjuntos'
        onChange={(e) => {
          agregar(e.target.files);
          e.target.value = '';
        }}
      />
      <div className='flex flex-wrap items-center gap-3'>
        <Buttons type='button' size='sm' variant='outline' onClick={() => input.current?.click()}>
          <HiOutlinePaperClip className='h-4 w-4' /> Adjuntar archivos
        </Buttons>
        <span className='text-xs text-muted-foreground'>
          {archivos.length ? `${archivos.length} archivo(s) · ${tamano(total)} de ${tamano(LIMITES_CORREO.adjuntosTotalBytes)}` : `Máx. ${tamano(LIMITES_CORREO.adjuntoBytes)} por archivo y ${tamano(LIMITES_CORREO.adjuntosTotalBytes)} en total`}
        </span>
      </div>
      {archivos.length ? (
        <ul className='divide-y divide-border rounded-xl border border-border text-sm'>
          {archivos.map((a, i) => (
            <li key={`${a.name}-${i}`} className='flex items-center gap-3 px-3 py-2'>
              <HiOutlinePaperClip className='h-4 w-4 shrink-0 text-muted-foreground' />
              <span className='min-w-0 flex-1 truncate'>{a.name}</span>
              <span className='text-xs text-muted-foreground'>{tamano(a.size)}</span>
              <button type='button' aria-label={`Quitar ${a.name}`} className='rounded p-1 text-muted-foreground hover:text-destructive' onClick={() => onChange(archivos.filter((_, j) => j !== i))}>
                <HiOutlineXMark className='h-4 w-4' />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
