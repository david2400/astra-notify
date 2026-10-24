/** @format */

'use client';

import { useState } from 'react';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { refrescarCacheRutasServerAction } from '@/app/[locale]/(protected)/administre/sms/actions';
import { ejecutarAccion } from '../utils/feedback';

/** Descarta la caché de rutas del motor (útil tras cambios directos en la base de datos). */
export function RefrescarCacheButton() {
  const [cargando, setCargando] = useState(false);
  return (
    <Buttons
      variant='outline'
      size='sm'
      loading={cargando}
      onClick={async () => {
        setCargando(true);
        await ejecutarAccion(() => refrescarCacheRutasServerAction(), {
          exito: 'Caché de rutas actualizada',
          error: 'No se pudo refrescar la caché de rutas.',
        });
        setCargando(false);
      }}>
      <HiOutlineArrowPath className='h-4 w-4' />
      Refrescar caché
    </Buttons>
  );
}
