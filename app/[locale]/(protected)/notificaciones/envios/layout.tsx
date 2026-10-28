/** @format */

import type { ReactNode } from 'react';
import { HistorialTabs } from '@/modules/notificaciones/envios';

export default function HistorialLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex flex-col gap-5'>
      <HistorialTabs />
      {children}
    </div>
  );
}
