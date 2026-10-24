/** @format */

'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HiOutlinePlus, HiOutlineSparkles, HiOutlineTrash } from 'react-icons/hi2';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { FormTextAreaField } from '@repo/ui/form/scenes/form-area';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { CheckField } from '../../shared/components/check-field';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { TIPOS_DATO, VARIABLE_DEFAULT } from '../models/plantilla.interface';
import { plantillaSchema, type PlantillaFormValues } from '../schemas/plantilla.schema';
import { variablesDelContenido } from '../utils/variables';

interface Props {
  initialValues: PlantillaFormValues;
  tipos: OpcionSelect[];
  bloquearCodigo?: boolean;
  onSubmit: (values: PlantillaFormValues) => Promise<void>;
}

export function FormPlantilla({ initialValues, tipos, bloquearCodigo, onSubmit }: Props) {
  const {
    control,
    register,
    watch,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlantillaFormValues>({ resolver: zodResolver(plantillaSchema), defaultValues: initialValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'variables' });
  const contenido = watch('contenido') ?? '';
  const usadas = variablesDelContenido(contenido);

  /** Agrega las {{variables}} del contenido que aún no están declaradas. */
  const detectar = () => {
    const declaradas = getValues('variables').map((v) => v.nombre.trim());
    usadas.filter((u) => !declaradas.includes(u)).forEach((nombre) => append({ ...VARIABLE_DEFAULT, nombre }));
  };

  const errorVariables = (errors.variables as { root?: { message?: string }; message?: string } | undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-12 gap-4'>
        <FormField
          id='codigo'
          label='Código'
          placeholder='Ej. RECORDATORIO_CITA'
          disabled={bloquearCodigo}
          className='col-span-12 md:col-span-4'
          error={errors.codigo?.message}
          {...register('codigo')}
        />
        <FormField
          id='nombre'
          label='Nombre'
          placeholder='Ej. Recordatorio de cita'
          className='col-span-12 md:col-span-5'
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <NativeSelect
          id='tipo_mensaje'
          label='Tipo por defecto'
          placeholder='Lo define el request'
          opciones={tipos}
          className='col-span-12 md:col-span-3'
          {...register('tipo_mensaje')}
        />
        <FormField
          id='descripcion'
          label='Descripción'
          className='col-span-12'
          error={errors.descripcion?.message}
          {...register('descripcion')}
        />
        <FormTextAreaField
          id='contenido'
          label='Contenido'
          rows={4}
          description={`${contenido.length}/1600 caracteres. Usa {{variable}} para los datos del request.`}
          className='col-span-12'
          error={errors.contenido?.message}
          {...register('contenido')}
        />
      </div>

      <div className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <p className='text-sm font-medium text-foreground'>
            Variables <span className='text-muted-foreground'>({usadas.length} en el contenido)</span>
          </p>
          <div className='flex gap-2'>
            <Buttons type='button' size='sm' variant='outline' onClick={detectar}>
              <HiOutlineSparkles className='h-4 w-4' />
              Detectar del contenido
            </Buttons>
            <Buttons type='button' size='sm' variant='outline' onClick={() => append({ ...VARIABLE_DEFAULT })}>
              <HiOutlinePlus className='h-4 w-4' />
              Agregar
            </Buttons>
          </div>
        </div>

        {fields.map((field, index) => {
          const e = errors.variables?.[index];
          return (
            <div key={field.id} className='grid grid-cols-12 items-end gap-3 rounded-xl border border-border/70 p-3'>
              <div className='col-span-12 space-y-1.5 md:col-span-3'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.nombre`}>
                  Nombre
                </label>
                <Input id={`variables.${index}.nombre`} {...register(`variables.${index}.nombre`)} />
                {e?.nombre?.message ? <p className='text-xs text-destructive'>{e.nombre.message}</p> : null}
              </div>
              <NativeSelect
                id={`variables.${index}.tipo_dato`}
                label='Tipo'
                opciones={TIPOS_DATO}
                className='col-span-6 md:col-span-2'
                {...register(`variables.${index}.tipo_dato`)}
              />
              <div className='col-span-6 space-y-1.5 md:col-span-2'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.longitud_max`}>
                  Long. máx.
                </label>
                <Input id={`variables.${index}.longitud_max`} inputMode='numeric' {...register(`variables.${index}.longitud_max`)} />
                {e?.longitud_max?.message ? <p className='text-xs text-destructive'>{e.longitud_max.message}</p> : null}
              </div>
              <div className='col-span-12 space-y-1.5 md:col-span-3'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.valor_defecto`}>
                  Valor por defecto
                </label>
                <Input id={`variables.${index}.valor_defecto`} {...register(`variables.${index}.valor_defecto`)} />
              </div>
              <div className='col-span-12 flex items-center justify-between gap-2 md:col-span-2 md:pb-2'>
                <CheckField id={`variables.${index}.obligatoria`} label='Obligatoria' {...register(`variables.${index}.obligatoria`)} />
                <Buttons type='button' size='icon-sm' variant='ghost' aria-label='Quitar variable' className='text-destructive' onClick={() => remove(index)}>
                  <HiOutlineTrash className='h-4 w-4' />
                </Buttons>
              </div>
              <div className='col-span-12 space-y-1.5 md:col-span-5'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.patron`}>
                  Patrón (regex, opcional)
                </label>
                <Input id={`variables.${index}.patron`} placeholder='Ej. [0-9]{4,8}' {...register(`variables.${index}.patron`)} />
              </div>
              <div className='col-span-12 space-y-1.5 md:col-span-7'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.descripcion`}>
                  Descripción
                </label>
                <Input id={`variables.${index}.descripcion`} {...register(`variables.${index}.descripcion`)} />
              </div>
            </div>
          );
        })}
        {errorVariables?.root?.message || errorVariables?.message ? (
          <p className='text-sm text-destructive'>{errorVariables.root?.message ?? errorVariables.message}</p>
        ) : null}
      </div>

      <Buttons type='submit' loading={isSubmitting} className='w-full'>
        Guardar
      </Buttons>
    </form>
  );
}
