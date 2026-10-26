/** @format */

'use client';

import { useRouter } from 'next/navigation';
import {
  actualizarTipoMensajeEmailServerAction,
  crearTipoMensajeEmailServerAction,
} from '@/app/[locale]/(protected)/administre/email/tipos-mensaje/actions';
import { ejecutarAccion, vacioANull } from '../../shared/utils/feedback';
import { FormTipoMensaje } from '../scenes/form-tipo-mensaje';
import type { TipoMensajeFormValues } from '../schemas/tipo-mensaje.schema';
import type { ITipoMensaje } from '../models/tipo-mensaje.interface';

const toPayload = (v: TipoMensajeFormValues) => ({
  codigo: v.codigo.trim().toUpperCase(),
  descripcion: vacioANull(v.descripcion),
  prioridad: v.prioridad,
  masivo: v.masivo,
});

export function RegisterTipoMensaje({ handleClose }: { handleClose: () => void }) {
  const router = useRouter();
  return (
    <FormTipoMensaje
      initialValues={{ codigo: '', descripcion: '', prioridad: 5, masivo: false }}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => crearTipoMensajeEmailServerAction(toPayload(values)), {
          exito: 'Tipo de mensaje creado',
          error: 'No se pudo crear el tipo de mensaje.',
        });
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}

export function UpdateTipoMensaje({ tipo, handleClose }: { tipo: ITipoMensaje; handleClose: () => void }) {
  const router = useRouter();
  return (
    <FormTipoMensaje
      bloquearCodigo
      initialValues={{ codigo: tipo.codigo, descripcion: tipo.descripcion ?? '', prioridad: tipo.prioridad, masivo: tipo.masivo }}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(
          () => actualizarTipoMensajeEmailServerAction(toPayload({ ...values, codigo: tipo.codigo })),
          { exito: 'Tipo de mensaje actualizado', error: 'No se pudo actualizar el tipo de mensaje.' },
        );
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}
