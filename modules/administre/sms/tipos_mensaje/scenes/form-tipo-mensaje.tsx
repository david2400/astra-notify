/** @format */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { Buttons } from '@repo/ui/buttons/scenes';
import { CheckField } from '../../shared/components/check-field';
import { NativeSelect } from '../../shared/components/native-select';
import { CANALES } from '../models/tipo-mensaje.interface';
import { tipoMensajeSchema, type TipoMensajeFormValues } from '../schemas/tipo-mensaje.schema';

interface Props {
  initialValues: TipoMensajeFormValues;
  /** El código lo usan rutas, servicios y envíos: no se cambia en edición. */
  bloquearCodigo?: boolean;
  onSubmit: (values: TipoMensajeFormValues) => Promise<void>;
}

export function FormTipoMensaje({ initialValues, bloquearCodigo, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TipoMensajeFormValues>({ resolver: zodResolver(tipoMensajeSchema), defaultValues: initialValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-12 gap-4'>
        <FormField
          id='codigo'
          label='Código'
          placeholder='Ej. OTP'
          disabled={bloquearCodigo}
          className='col-span-12 md:col-span-7'
          error={errors.codigo?.message}
          {...register('codigo')}
        />
        <NativeSelect
          id='canal'
          label='Canal'
          opciones={CANALES}
          className='col-span-12 md:col-span-5'
          error={errors.canal?.message}
          {...register('canal')}
        />
        <FormField
          id='descripcion'
          label='Descripción'
          placeholder='Ej. Código de verificación de un solo uso'
          className='col-span-12'
          error={errors.descripcion?.message}
          {...register('descripcion')}
        />
        <CheckField
          id='otp'
          label='Lleva código de un solo uso (OTP)'
          description='El motor lo trata como mensaje sensible y prioritario.'
          className='col-span-12 md:col-span-6'
          {...register('otp')}
        />
        <CheckField
          id='masivo'
          label='Apto para envíos masivos'
          description='Puede usarse en /v1/sms/batch y en cuentas de masivo.'
          className='col-span-12 md:col-span-6'
          {...register('masivo')}
        />
      </div>
      <Buttons type='submit' loading={isSubmitting} className='w-full'>
        Guardar
      </Buttons>
    </form>
  );
}
