/** @format */

import type { ReactNode } from 'react';

/** Bloque titulado del formulario de envío. */
export function Bloque({ titulo, descripcion, children, acciones }: { titulo: string; descripcion?: string; children: ReactNode; acciones?: ReactNode }) {
  return (
    <section className='space-y-4 rounded-2xl border border-border/60 bg-card p-5'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div>
          <h2 className='text-base font-semibold text-foreground'>{titulo}</h2>
          {descripcion ? <p className='text-sm text-muted-foreground'>{descripcion}</p> : null}
        </div>
        {acciones}
      </div>
      {children}
    </section>
  );
}

/** Opción de radio en forma de pastilla (texto libre / plantilla, etc.). */
export function OpcionRadio({ nombre, valor, actual, onChange, children }: { nombre: string; valor: string; actual: string; onChange: (v: string) => void; children: ReactNode }) {
  const activo = valor === actual;
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
        activo ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
      }`}>
      <input type='radio' name={nombre} value={valor} checked={activo} onChange={() => onChange(valor)} className='accent-primary' />
      {children}
    </label>
  );
}

/** Mensaje de validación del formulario. */
export function AvisoError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p role='alert' className='rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
      {mensaje}
    </p>
  );
}
