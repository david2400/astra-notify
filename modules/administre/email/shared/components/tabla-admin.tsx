/** @format */

import type { ReactNode } from 'react';

/**
 * Contenedor con scroll horizontal para las tablas de administración: DataTable recorta lo que
 * no cabe (overflow-hidden), así que en pantallas angostas la tabla se desplaza en vez de cortarse.
 */
export function TablaAdmin({ minWidth = 960, children }: { minWidth?: number; children: ReactNode }) {
  return (
    <div className='-mx-1 overflow-x-auto px-1'>
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}
