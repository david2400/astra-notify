/** @format */

import type { ReactNode } from 'react';
import { SectionShell } from '@/components/layout/section-shell';
import { EmailAdminNav, RefrescarCacheButton } from '@/modules/administre/email/shared';

/** Administración de email (configuración en notificacion, plantillas y envíos en email_gateway): encabezado y pestañas. */
export default function AdministreEmailLayout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      eyebrow='Administración'
      title='Configuración Email'
      description='Envíos, proveedores (Gmail, Brevo), cuentas, tipos de mensaje, servicios, rutas y plantillas del gateway de email.'
      actions={<RefrescarCacheButton />}>
      <EmailAdminNav />
      {children}
    </SectionShell>
  );
}
