/** @format */

import type { ReactNode } from 'react';
import { SectionShell } from '@/components/layout/section-shell';
import { NotificacionesNav } from '@/modules/notificaciones/shared';

/** Envío de notificaciones (SMS por sms_gateway, correo por email_gateway) e historial. */
export default function NotificacionesLayout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      eyebrow='Notificaciones'
      title='Envío de notificaciones'
      description='Envía SMS y correos individuales o masivos, con texto libre o plantillas, y consulta su historial.'>
      <NotificacionesNav />
      {children}
    </SectionShell>
  );
}
