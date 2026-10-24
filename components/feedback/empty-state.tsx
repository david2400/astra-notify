/** @format */

import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Icono opcional; se marca como decorativo. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Acción primaria sugerida, p. ej. "Crear el primero". */
  action?: ReactNode;
}

/**
 * Estado vacío común para tablas y listados.
 *
 * Antes, cuando el backend devolvía cero registros, las pantallas mostraban
 * una tabla con sólo la fila de encabezados, sin explicar qué pasaba ni qué
 * podía hacer el usuario.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center'>
      {icon ? (
        <span aria-hidden='true' className='text-muted-foreground'>
          {icon}
        </span>
      ) : null}
      <div className='space-y-1'>
        <p className='text-sm font-semibold text-foreground'>{title}</p>
        {description ? (
          <p className='mx-auto max-w-md text-sm text-muted-foreground'>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className='pt-1'>{action}</div> : null}
    </div>
  );
}
