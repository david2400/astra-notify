/** @format */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { Buttons } from '@repo/ui/buttons/scenes';
import { proveedorSchema, type ProveedorFormValues } from '../schemas/proveedor.schema';

interface FormProveedorProps {
  initialValues: ProveedorFormValues;
  /** Códigos con módulo implementado (sugerencias del campo código). */
  implementados: string[];
  /** En edición el código no se cambia: lo usan las cuentas y el motor. */
  bloquearCodigo?: boolean;
  onSubmit: (values: ProveedorFormValues) => Promise<void>;
}

export function FormProveedor({ initialValues, implementados, bloquearCodigo, onSubmit }: FormProveedorProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormValues>({ resolver: zodResolver(proveedorSchema), defaultValues: initialValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-12 gap-4'>
        <FormField
          id='codigo'
          label='Código'
          placeholder='Ej. INALAMBRIA'
          list='proveedores-implementados'
          disabled={bloquearCodigo}
          description='Debe coincidir con un módulo implementado en sms_gateway.'
          className='col-span-12 md:col-span-5'
          error={errors.codigo?.message}
          {...register('codigo')}
        />
        <datalist id='proveedores-implementados'>
          {implementados.map((codigo) => (
            <option key={codigo} value={codigo} />
          ))}
        </datalist>
        <FormField
          id='nombre'
          label='Nombre'
          placeholder='Ej. Inalambria'
          className='col-span-12 md:col-span-7'
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <FormField
          id='base_url'
          label='URL base'
          placeholder='https://restaws.inalambria.com'
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
