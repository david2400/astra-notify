/** @format */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { Buttons } from '@repo/ui/buttons/scenes';
import { proveedorSchema, type ProveedorFormValues } from '../schemas/proveedor.schema';
import { BASE_URL_SUGERIDA } from '../models/proveedor.interface';

interface Props {
  initialValues: ProveedorFormValues;
  implementados: string[];
  bloquearCodigo?: boolean;
  onSubmit: (values: ProveedorFormValues) => Promise<void>;
}

export function FormProveedor({ initialValues, implementados, bloquearCodigo, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormValues>({ resolver: zodResolver(proveedorSchema), defaultValues: initialValues });
  const codigo = (watch('codigo') ?? '').toUpperCase();
  const codigoField = register('codigo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-12 gap-4'>
        <FormField
          id='codigo'
          label='Código'
          placeholder='Ej. BREVO'
          list='proveedores-email-implementados'
          disabled={bloquearCodigo}
          description='Debe coincidir con un proveedor implementado en email_gateway.'
          className='col-span-12 md:col-span-5'
          error={errors.codigo?.message}
          {...codigoField}
          onChange={(e) => {
            void codigoField.onChange(e);
            const sugerida = BASE_URL_SUGERIDA[e.target.value.trim().toUpperCase()];
            if (sugerida && !getValues('base_url')) setValue('base_url', sugerida);
          }}
        />
        <datalist id='proveedores-email-implementados'>
          {implementados.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <FormField
          id='nombre'
          label='Nombre'
          placeholder='Ej. Brevo API transaccional'
          className='col-span-12 md:col-span-7'
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <FormField
          id='base_url'
          label={codigo === 'GMAIL' ? 'Host SMTP' : 'URL base'}
          placeholder={BASE_URL_SUGERIDA[codigo] ?? 'https://api.brevo.com/v3'}
          description='Gmail: smtp.gmail.com · Brevo: https://api.brevo.com/v3'
          className='col-span-12'
          error={errors.base_url?.message}
          {...register('base_url')}
        />
        <FormField
          id='connect_timeout_ms'
          type='number'
          label='Timeout de conexión (ms)'
          className='col-span-12 md:col-span-6'
          error={errors.connect_timeout_ms?.message}
          {...register('connect_timeout_ms')}
        />
        <FormField
          id='read_timeout_ms'
          type='number'
          label='Timeout de lectura (ms)'
          className='col-span-12 md:col-span-6'
          error={errors.read_timeout_ms?.message}
          {...register('read_timeout_ms')}
        />
      </div>
      <Buttons type='submit' loading={isSubmitting} className='w-full'>
        Guardar
      </Buttons>
    </form>
  );
}
