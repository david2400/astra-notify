/** @format */

'use client';

import { Link, usePathname } from '@/shared/i18n/routing';
import { SMS_ADMIN_SECCIONES } from '../utils/secciones';

/** Pestañas de la administración SMS (una por módulo). */
export function SmsAdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label='Administración SMS' className='-mx-1 flex gap-1 overflow-x-auto border-b border-border pb-px'>
      {SMS_ADMIN_SECCIONES.map((seccion) => {
        const activo = seccion.href === '/administre/sms' ? pathname === seccion.href : pathname.startsWith(seccion.href);
        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            aria-current={activo ? 'page' : undefined}
            className={`whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activo
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}>
            {seccion.label}
          </Link>
        );
      })}
    </nav>
  );
}
