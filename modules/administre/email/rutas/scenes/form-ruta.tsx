/** @format */

'use client';

import { useMemo } from 'react';
import { useForm, type Control, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Label } from '@repo/ui/label/scenes/label';
import type { ICuenta } from '@/server/domains/administre/email/cuentas/types';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { PASO_DEFAULT } from '../models/ruta.interface';
import { pasosFormSchema, rutaSchema, type PasosFormValues, type RutaFormValues } from '../schemas/ruta.schema';
import { PasosEditor } from './pasos-editor';

const opcionesCuenta = (cuentas: ICuenta[], proveedor: string) =>
  cuentas
    .filter((c) => !proveedor || c.proveedor === proveedor)
    .map((c) => ({
      value: c.codigo,
      label: `${c.codigo} (${c.proveedor})${c.eliminado ? ' — inactiva' : ''}${!c.credencial_disponible && c.proveedor !== 'MOCK' ? ' — sin credenciales' : ''}`,
    }));

interface FormRutaProps {
  proveedores: OpcionSelect[];
  tipos: OpcionSelect[];
  cuentas: ICuenta[];
  onSubmit: (values: RutaFormValues) => Promise<void>;
}

/** Nueva ruta: CENTRAL (todas las cuentas) o de un proveedor (solo sus cuentas). */
export function FormRuta({ proveedores, tipos, cuentas, onSubmit }: FormRutaProps) {
  const {
    control,
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RutaFormValues>({
    resolver: zodResolver(rutaSchema),
    defaultValues: { codigo: '', proveedor: '', tipo_mensaje: '', pasos: [{ ...PASO_DEFAULT }] },
  });
  const proveedor = watch('proveedor');
  const opciones = useMemo(() => opcionesCuenta(cuentas, proveedor), [cuentas, proveedor]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-12 gap-4'>
        <div className='col-span-12 space-y-1.5'>
          <Label htmlFor='codigo'>Código (opcional)</Label>
          <Input id='codigo' maxLength={50} placeholder='OTP_PRIORITARIA' className='uppercase' {...register('codigo')} />
          {errors.codigo?.message ? (
            <p className='text-xs text-destructive'>{errors.codigo.message}</p>
          ) : (
            <p className='text-xs text-muted-foreground'>Permite pedir esta ruta en el envío con el campo <code>ruta</code> (también sirve el id).</p>
          )}
        </div>
        <NativeSelect
          id='proveedor'
          label='Ruta de'
          placeholder='CENTRAL (/v1/email/send)'
          opciones={proveedores}
          className='col-span-12 md:col-span-6'
          {...register('proveedor')}
        />
        <NativeSelect
          id='tipo_mensaje'
          label='Tipo de mensaje'
          placeholder='Selecciona...'
          opciones={tipos}
          className='col-span-12 md:col-span-6'
          error={errors.tipo_mensaje?.message}
          {...register('tipo_mensaje')}
        />
      </div>
      <p className='text-xs text-muted-foreground'>
        Si existe una ruta inactiva para el mismo origen y tipo, el gateway la reactiva con estos pasos.
      </p>
      <PasosEditor
        control={control as unknown as Control<PasosFormValues>}
        register={register as unknown as UseFormRegister<PasosFormValues>}
        errors={errors}
        cuentas={opciones}
      />
      <Buttons type='submit' loading={isSubmitting} className='w-full'>
        Crear ruta
      </Buttons>
    </form>
  );
}

interface FormPasosProps {
  initialValues: PasosFormValues;
  cuentas: ICuenta[];
  /** null = ruta CENTRAL (cualquier cuenta). */
  proveedor: string | null;
  onSubmit: (values: PasosFormValues) => Promise<void>;
}

/** Reemplaza todos los pasos de una ruta existente. */
export function FormPasos({ initialValues, cuentas, proveedor, onSubmit }: FormPasosProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasosFormValues>({ resolver: zodResolver(pasosFormSchema), defaultValues: initialValues });
  const opciones = useMemo(() => opcionesCuenta(cuentas, proveedor ?? ''), [cuentas, proveedor]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <PasosEditor control={control} register={register} errors={errors} cuentas={opciones} />
      <Buttons type='submit' loading={isSubmitting} className='w-full'>
        Guardar pasos
      </Buttons>
    </form>
  );
}
