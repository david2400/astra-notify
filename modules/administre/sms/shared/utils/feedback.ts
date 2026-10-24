'use client';

import Swal from 'sweetalert2';
import type { ActionResult } from '@/server/lib/types/action.type';

/**
 * Ejecuta una server action que devuelve ActionResult y muestra el resultado con SweetAlert
 * (mismo estilo que draco). Devuelve los datos si salió bien y null si falló.
 */
export async function ejecutarAccion<T>(
  accion: () => Promise<ActionResult<T>>,
  mensajes: { exito?: string; error: string },
): Promise<T | null> {
  try {
    const resultado = await accion();
    if (!resultado.success) {
      await Swal.fire({ title: 'Error', text: resultado.error || mensajes.error, icon: 'error' });
      return null;
    }
    if (mensajes.exito) {
      void Swal.fire({ title: mensajes.exito, icon: 'success', timer: 2200, showConfirmButton: false });
    }
    return resultado.data;
  } catch (error) {
    await Swal.fire({ title: 'Error', text: (error as Error)?.message || mensajes.error, icon: 'error' });
    return null;
  }
}

/** Confirmación antes de una acción destructiva o de cambio de estado. */
export async function confirmar(titulo: string, texto?: string, confirmText = 'Sí, continuar'): Promise<boolean> {
  const respuesta = await Swal.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
  });
  return respuesta.isConfirmed;
}

/** Texto vacío → undefined (los opcionales no se envían como ""). */
export const vacioANull = (valor?: string | null): string | null => {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
};
