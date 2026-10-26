/** @format */

'use client';

import { useState } from 'react';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { refrescarCacheEmailServerAction } from '@/app/[locale]/(protected)/administre/email/actions';
import { ejecutarAccion } from '../utils/feedback';

/** Descarta las cachés del motor de email (rutas, cuentas, servicios y plantillas). */
export function RefrescarCacheButton() {
  const [cargando, setCargando] = useState(false);
  return (
    <Buttons
      variant='outline'
      size='sm'
      loading={cargando}
      onClick={async () => {
        setCargando(true);
        await ejecutarAccion(() => refrescarCacheEmailServerAction(), {
          exito: 'Caché del gateway de email actualizada',
          error: 'No se pudo refrescar la caché.',
        });
        setCargando(false);
      }}>
      <HiOutlineArrowPath className='h-4 w-4' />
      Refrescar caché
    </Buttons>
  );
}
