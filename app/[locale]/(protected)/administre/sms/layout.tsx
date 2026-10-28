/** @format */

import type { ReactNode } from 'react';
import { SectionShell } from '@/components/layout/section-shell';
import { RefrescarCacheButton, SmsAdminNav } from '@/modules/administre/sms/shared';

/** Administración de SMS (configuración en notificacion, plantillas en sms_gateway): encabezado común y pestañas. */
export default function AdministreSmsLayout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      eyebrow='Administración'
      title='Configuración SMS'
      description='Proveedores, cuentas, tipos de mensaje, servicios, rutas y plantillas del motor de envío.'
      actions={<RefrescarCacheButton />}>
      <SmsAdminNav />
      {children}
    </SectionShell>
  );
}
