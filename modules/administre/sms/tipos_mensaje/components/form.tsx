/** @format */

'use client';

import { useRouter } from 'next/navigation';
import {
  actualizarTipoMensajeServerAction,
  crearTipoMensajeServerAction,
} from '@/app/[locale]/(protected)/administre/sms/tipos-mensaje/actions';
import { ejecutarAccion, vacioANull } from '../../shared/utils/feedback';
import { FormTipoMensaje } from '../scenes/form-tipo-mensaje';
import { TIPO_MENSAJE_FORM_DEFAULT, type TipoMensajeFormValues } from '../schemas/tipo-mensaje.schema';
import type { ITipoMensaje } from '../models/tipo-mensaje.interface';

const toPayload = (v: TipoMensajeFormValues) => ({
  codigo: v.codigo.trim().toUpperCase(),
  descripcion: vacioANull(v.descripcion),
  canal: v.canal,
  otp: v.otp,
  masivo: v.masivo,
});

export function RegisterTipoMensaje({ handleClose }: { handleClose: () => void }) {
  const router = useRouter();
  return (
    <FormTipoMensaje
      initialValues={TIPO_MENSAJE_FORM_DEFAULT}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => crearTipoMensajeServerAction(toPayload(values)), {
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
      initialValues={{
        codigo: tipo.codigo,
        descripcion: tipo.descripcion ?? '',
        canal: tipo.canal,
        otp: tipo.otp,
        masivo: tipo.masivo,
      }}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(
          () => actualizarTipoMensajeServerAction({ id: tipo.id, ...toPayload({ ...values, codigo: tipo.codigo }) }),
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
