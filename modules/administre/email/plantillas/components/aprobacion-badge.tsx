/** @format */

import { Badge } from '@repo/ui/badges/scenes/badge';
import type { EstadoAprobacion } from '../models/plantilla.interface';

export const ESTADOS_APROBACION: Record<EstadoAprobacion, { etiqueta: string; clase: string }> = {
  BORRADOR: { etiqueta: 'Borrador', clase: 'border-slate-400/50 bg-slate-500/10 text-slate-700 dark:text-slate-300' },
  EN_REVISION: { etiqueta: 'En revisión', clase: 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300' },
  APROBADA: { etiqueta: 'Aprobada', clase: 'border-sky-500/50 bg-sky-500/15 text-sky-800 dark:text-sky-300' },
  RECHAZADA: { etiqueta: 'Rechazada', clase: 'border-destructive/40 bg-destructive/15 text-destructive' },
  PUBLICADA: { etiqueta: 'Publicada', clase: 'border-emerald-600/50 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300' },
  REEMPLAZADA: { etiqueta: 'Reemplazada', clase: 'border-border/70 bg-transparent text-muted-foreground' },
  DESCARTADA: { etiqueta: 'Descartada', clase: 'border-border/70 bg-transparent text-muted-foreground line-through' },
};

/** Estado de aprobación de una versión de plantilla (solo la PUBLICADA se envía). */
export function AprobacionBadge({ estado }: { estado?: EstadoAprobacion | null }) {
  const e = ESTADOS_APROBACION[estado ?? 'BORRADOR'] ?? ESTADOS_APROBACION.BORRADOR;
  return <Badge className={e.clase}>{e.etiqueta}</Badge>;
}

/** Resumen de versión para el listado: versión actual, su estado y cuál se envía. */
export function VersionResumen({ version, estado, publicada }: { version: number; estado?: EstadoAprobacion | null; publicada?: number | null }) {
  const enviaOtra = publicada != null && publicada !== version;
  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-1.5'>
        <span className='text-sm font-semibold tabular-nums text-foreground'>v{version}</span>
        <AprobacionBadge estado={estado} />
      </div>
      <p className='text-[11px] text-muted-foreground'>
        {publicada == null ? <span className='font-medium text-destructive'>Sin versión publicada: no se envía</span> : enviaOtra ? `Se envía la v${publicada}` : 'Es la que se envía'}
      </p>
    </div>
  );
}
