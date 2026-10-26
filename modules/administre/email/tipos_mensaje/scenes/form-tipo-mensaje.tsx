/** @format */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { Buttons } from '@repo/ui/buttons/scenes';
import { CheckField } from '../../shared/components/check-field';
import { NativeSelect } from '../../shared/components/native-select';
import { PRIORIDADES } from '../models/tipo-mensaje.interface';
import { tipoMensajeSchema, type TipoMensajeFormValues } from '../schemas/tipo-mensaje.schema';

interface Props {
  initialValues: TipoMensajeFormValues;
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
          placeholder='Ej. TRANSACCIONAL'
          disabled={bloquearCodigo}
          className='col-span-12 md:col-span-7'
          error={errors.codigo?.message}
          {...register('codigo')}
        />
        <NativeSelect
          id='prioridad'
          label='Prioridad en la cola'
          opciones={PRIORIDADES}
          className='col-span-12 md:col-span-5'
          error={errors.prioridad?.message}
          {...register('prioridad')}
        />
        <FormField
          id='descripcion'
          label='Descripción'
          className='col-span-12'
          error={errors.descripcion?.message}
          {...register('descripcion')}
        />
        <CheckField
          id='masivo'
          label='Masivo'
          description='Campañas y comunicaciones masivas (usualmente solo por Brevo).'
          className='col-span-12'
          {...register('masivo')}
        />
      </div>
      <Buttons type='submit' loading={isSubmitting} className='w-full'>
        Guardar
      </Buttons>
    </form>
  );
}
