/** @format */

'use client';

import { Link, usePathname } from '@/shared/i18n/routing';
import { NOTIFICACIONES_SECCIONES } from '../utils/secciones';

export function NotificacionesNav() {
  const pathname = usePathname();
  return (
    <nav aria-label='Notificaciones' className='-mx-1 flex gap-1 overflow-x-auto border-b border-border pb-px'>
      {NOTIFICACIONES_SECCIONES.map((s) => {
        const activo = pathname.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activo ? 'page' : undefined}
            className={`whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activo ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}>
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
