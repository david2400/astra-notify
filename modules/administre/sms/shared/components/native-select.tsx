/** @format */

'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface OpcionSelect {
  value: string;
  label: string;
}

interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  opciones: OpcionSelect[];
  /** Primera opción vacía (ej. "Selecciona..." o "Todos"). */
  placeholder?: string;
}

/**
 * Select nativo con el estilo de los inputs de @repo/ui. Se usa en listas dinámicas
 * (pasos de ruta, variables) y filtros, donde register() es más simple que un Select controlado.
 */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ label, error, opciones, placeholder, className, id, ...rest }, ref) => (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      {label ? (
        <label htmlFor={id} className='text-sm font-medium text-foreground'>
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive'
        {...rest}>
        {placeholder !== undefined ? <option value=''>{placeholder}</option> : null}
        {opciones.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
      {error ? <p className='text-xs text-destructive'>{error}</p> : null}
    </div>
  ),
);
NativeSelect.displayName = 'NativeSelect';
