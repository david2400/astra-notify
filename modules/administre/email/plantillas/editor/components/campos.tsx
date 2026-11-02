/** @format */

'use client';

import { useId, useRef, type ReactNode } from 'react';
import { HiOutlineBars3BottomLeft, HiOutlineBars3, HiOutlineBars3BottomRight } from 'react-icons/hi2';
import type { Alineacion } from '../models/diseno';
import { SelectorVariables } from './selector-variables';

const claseInput =
  'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export function Campo({ etiqueta, children, ayuda, htmlFor }: { etiqueta: string; children: ReactNode; ayuda?: string; htmlFor?: string }) {
  return (
    <div className='space-y-1.5'>
      <label htmlFor={htmlFor} className='text-xs font-medium text-muted-foreground'>
        {etiqueta}
      </label>
      {children}
      {ayuda ? <p className='text-[11px] leading-4 text-muted-foreground'>{ayuda}</p> : null}
    </div>
  );
}

export function CampoTexto({
  etiqueta,
  valor,
  onChange,
  placeholder,
  ayuda,
  variables,
  tipo = 'text',
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ayuda?: string;
  /** Si se pasa, muestra el botón Personalizar para insertar {{variable}} en el cursor. */
  variables?: string[];
  tipo?: 'text' | 'url';
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const insertar = (nombre: string) => {
    const el = ref.current;
    const token = `{{${nombre}}}`;
    if (!el) return onChange(valor + token);
    const a = el.selectionStart ?? valor.length;
    const b = el.selectionEnd ?? valor.length;
    onChange(valor.slice(0, a) + token + valor.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + token.length, a + token.length);
    });
  };
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} htmlFor={id}>
      <div className='flex gap-1.5'>
        <input id={id} ref={ref} type={tipo === 'url' ? 'text' : 'text'} inputMode={tipo === 'url' ? 'url' : undefined} className={claseInput} value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        {variables ? <SelectorVariables variables={variables} onSeleccionar={insertar} compacto /> : null}
      </div>
    </Campo>
  );
}

export function CampoArea({ etiqueta, valor, onChange, filas = 6, mono }: { etiqueta: string; valor: string; onChange: (v: string) => void; filas?: number; mono?: boolean }) {
  const id = useId();
  return (
    <Campo etiqueta={etiqueta} htmlFor={id}>
      <textarea
        id={id}
        rows={filas}
        className={`w-full resize-y rounded-lg border border-input bg-background p-2.5 text-xs leading-5 outline-none focus-visible:ring-2 focus-visible:ring-ring ${mono ? 'font-mono' : ''}`}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    </Campo>
  );
}

export function CampoNumero({ etiqueta, valor, onChange, min = 0, max = 200, paso = 1, unidad = 'px' }: { etiqueta: string; valor: number; onChange: (v: number) => void; min?: number; max?: number; paso?: number; unidad?: string }) {
  const id = useId();
  return (
    <Campo etiqueta={`${etiqueta}${unidad ? ` (${unidad})` : ''}`} htmlFor={id}>
      <div className='flex items-center gap-2'>
        <input id={id} type='range' min={min} max={max} step={paso} value={valor} onChange={(e) => onChange(Number(e.target.value))} className='h-2 flex-1 accent-primary' aria-label={etiqueta} />
        <input
          type='number'
          min={min}
          max={max}
          step={paso}
          value={valor}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          className='h-8 w-16 rounded-md border border-input bg-background px-2 text-right text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'
          aria-label={`${etiqueta} (valor)`}
        />
      </div>
    </Campo>
  );
}

export function CampoColor({ etiqueta, valor, onChange, permitirVacio, textoVacio = 'Sin color' }: { etiqueta: string; valor: string; onChange: (v: string) => void; permitirVacio?: boolean; textoVacio?: string }) {
  const id = useId();
  const valido = /^#[0-9a-fA-F]{6}$/.test(valor);
  return (
    <Campo etiqueta={etiqueta} htmlFor={id}>
      <div className='flex items-center gap-2'>
        <input id={id} type='color' value={valido ? valor : '#ffffff'} onChange={(e) => onChange(e.target.value)} className='h-9 w-11 cursor-pointer rounded-md border border-input bg-background p-1' aria-label={`${etiqueta} (selector)`} />
        <input value={valor} placeholder={permitirVacio ? textoVacio : '#000000'} onChange={(e) => onChange(e.target.value.trim())} className={`${claseInput} font-mono text-xs`} aria-label={`${etiqueta} (hex)`} />
        {permitirVacio && valor ? (
          <button type='button' onClick={() => onChange('')} className='shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground'>
            Quitar
          </button>
        ) : null}
      </div>
    </Campo>
  );
}

export function CampoSelect<T extends string>({ etiqueta, valor, onChange, opciones }: { etiqueta: string; valor: T; onChange: (v: T) => void; opciones: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <Campo etiqueta={etiqueta} htmlFor={id}>
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value as T)} className={claseInput}>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Campo>
  );
}

export function CampoAlineacion({ valor, onChange, etiqueta = 'Alineación' }: { valor: Alineacion; onChange: (v: Alineacion) => void; etiqueta?: string }) {
  const opciones: { v: Alineacion; icono: ReactNode; nombre: string }[] = [
    { v: 'left', icono: <HiOutlineBars3BottomLeft className='h-4 w-4' />, nombre: 'Izquierda' },
    { v: 'center', icono: <HiOutlineBars3 className='h-4 w-4' />, nombre: 'Centro' },
    { v: 'right', icono: <HiOutlineBars3BottomRight className='h-4 w-4' />, nombre: 'Derecha' },
  ];
  return (
    <Campo etiqueta={etiqueta}>
      <div role='radiogroup' aria-label={etiqueta} className='inline-flex rounded-lg border border-input p-0.5'>
        {opciones.map((o) => (
          <button
            key={o.v}
            type='button'
            role='radio'
            aria-checked={valor === o.v}
            aria-label={o.nombre}
            title={o.nombre}
            onClick={() => onChange(o.v)}
            className={`rounded-md px-3 py-1.5 transition ${valor === o.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            {o.icono}
          </button>
        ))}
      </div>
    </Campo>
  );
}

export function CampoInterruptor({ etiqueta, valor, onChange }: { etiqueta: string; valor: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className='flex cursor-pointer items-center justify-between gap-3 text-sm'>
      <span className='text-xs font-medium text-muted-foreground'>{etiqueta}</span>
      <input id={id} type='checkbox' checked={valor} onChange={(e) => onChange(e.target.checked)} className='h-4 w-4 accent-primary' />
    </label>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className='space-y-3 border-b border-border/70 pb-4 last:border-0'>
      <h4 className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>{titulo}</h4>
      {children}
    </section>
  );
}
