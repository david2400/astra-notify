/** @format */

'use client';

import { Link, usePathname } from '@/shared/i18n/routing';

const SMS = '/notificaciones/envios';
const CORREO = '/notificaciones/envios/correo';
const TABS = [
  { label: 'SMS', href: SMS },
  { label: 'Correo', href: CORREO },
];

/** Pestañas del historial: cada canal es una ruta (sus filtros viven en la URL). */
export function HistorialTabs() {
  const pathname = usePathname();
  const activo = pathname.endsWith('/correo') ? CORREO : SMS;
  return (
    <div role='tablist' aria-label='Canal' className='inline-flex rounded-xl border border-border bg-muted/40 p-1'>
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          role='tab'
          aria-selected={activo === t.href}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${activo === t.href ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
