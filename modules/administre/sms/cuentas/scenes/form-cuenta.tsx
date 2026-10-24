/** @format */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { FormTextAreaField } from '@repo/ui/form/scenes/form-area';
import { Buttons } from '@repo/ui/buttons/scenes';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { cuentaSchema, type CuentaFormValues } from '../schemas/cuenta.schema';

interface FormCuentaProps {
  initialValues: CuentaFormValues;
  proveedores: OpcionSelect[];
  edicion?: boolean;
  /** En edición: si ya hay clave cifrada guardada. */
  claveConfigurada?: boolean;
  onSubmit: (values: CuentaFormValues) => Promise<void>;
}

export function FormCuenta({ initialValues, proveedores, edicion, claveConfigurada, onSubmit }: FormCuentaProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CuentaFormValues>({ resolver: zodResolver(cuentaSchema), defaultValues: initialValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-12 gap-4'>
        <NativeSelect
          id='proveedor_id'
          label='Proveedor'
          placeholder='Selecciona...'
          opciones={proveedores}
          disabled={edicion}
          className='col-span-12 md:col-span-5'
          error={errors.proveedor_id?.message}
          {...register('proveedor_id')}
        />
        <FormField
          id='codigo'
          label='Código'
          placeholder='Ej. INALAMBRIA_OTP'
          disabled={edicion}
          className='col-span-12 md:col-span-7'
          error={errors.codigo?.message}
          {...register('codigo')}
        />
        <FormField
          id='usuario'
          label='Usuario / API key'
          placeholder='usuario o env:VARIABLE'
          description="Con 'env:NOMBRE' se lee de una variable de entorno del gateway."
          className='col-span-12 md:col-span-6'
          error={errors.usuario?.message}
          {...register('usuario')}
        />
        <FormField
          id='remitente'
          label='Remitente'
          placeholder='Ej. 890500 o RANDOM'
          className='col-span-12 md:col-span-6'
          error={errors.remitente?.message}
          {...register('remitente')}
        />
        <FormField
          id='clave'
          type='password'
          autoComplete='new-password'
          label='Clave / API secret'
          placeholder={edicion && claveConfigurada ? '•••••• (vacío = conservar la actual)' : 'Se guarda cifrada'}
          description='Se guarda cifrada (AES-256) y nunca se vuelve a mostrar.'
          className='col-span-12 md:col-span-6'
          error={errors.clave?.message}
          {...register('clave')}
        />
        <FormField
          id='secret_ref'
          label='Variable de entorno de la clave (opcional)'
          placeholder='Ej. INALAMBRIA_OTP_PASSWORD'
          description='Alternativa a guardar la clave cifrada.'
          className='col-span-12 md:col-span-6'
          error={errors.secret_ref?.message}
          {...register('secret_ref')}
        />
        <FormTextAreaField
          id='parametros'
          label='Parámetros del proveedor (JSON)'
          rows={5}
          classNameInput='font-mono text-xs'
          description='Ej. Inalambria: {"type":1,"messagePattern":"0","templateId":0}'
          className='col-span-12'
          error={errors.parametros?.message}
          {...register('parametros')}
        />
      </div>
      <Buttons type='submit' loading={isSubmitting} className='w-full'>
        Guardar
      </Buttons>
    </form>
  );
}
