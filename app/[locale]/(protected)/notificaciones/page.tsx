/** @format */

import type { Metadata } from 'next';
import { HiOutlineChatBubbleLeftRight, HiOutlineClock, HiOutlineEnvelope } from 'react-icons/hi2';
import { Link } from '@/shared/i18n/routing';
import { NOTIFICACIONES_SECCIONES } from '@/modules/notificaciones/shared';

export const metadata: Metadata = { title: 'Notificaciones' };

const ICONOS = [HiOutlineChatBubbleLeftRight, HiOutlineEnvelope, HiOutlineClock];

/** Accesos a las tres secciones del módulo. */
export default function NotificacionesPage() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
      {NOTIFICACIONES_SECCIONES.map((s, i) => {
        const Icono = ICONOS[i] ?? HiOutlineClock;
        return (
          <Link key={s.href} href={s.href} className='group rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/60 hover:shadow-sm'>
            <Icono className='h-7 w-7 text-primary' />
            <p className='mt-3 font-semibold text-foreground group-hover:text-primary'>{s.label}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{s.descripcion}</p>
          </Link>
        );
      })}
    </div>
  );
}
