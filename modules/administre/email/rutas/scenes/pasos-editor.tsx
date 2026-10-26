/** @format */

'use client';

import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { PASO_DEFAULT } from '../models/ruta.interface';

import type { PasosFormValues } from '../schemas/ruta.schema';

interface Props {
  /** Formularios con un campo `pasos` (creación de ruta o solo edición de pasos). */
  control: Control<PasosFormValues>;
  register: UseFormRegister<PasosFormValues>;
  errors: FieldErrors<PasosFormValues>;
  cuentas: OpcionSelect[];
}

/**
 * Lista ordenada de cuentas: el motor intenta el paso 1 (max_intentos veces, con backoff exponencial desde espera_ms
 * entre intentos) y si falla pasa al 2, y así sucesivamente.
 */
export function PasosEditor({ control, register, errors, cuentas }: Props) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'pasos' });
  const errorLista = (errors.pasos as { root?: { message?: string }; message?: string } | undefined);

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-foreground'>Pasos (orden de intento)</p>
        <Buttons type='button' size='sm' variant='outline' onClick={() => append({ ...PASO_DEFAULT })}>
          <HiOutlinePlus className='h-4 w-4' />
          Agregar paso
        </Buttons>
      </div>

      {fields.length === 0 ? (
        <p className='rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground'>
          Sin pasos: los envíos de esta ruta responderían 422 RUTA_NO_CONFIGURADA.
        </p>
      ) : null}

      {fields.map((field, index) => {
        const e = errors.pasos?.[index];
        return (
          <div key={field.id} className='grid grid-cols-12 items-end gap-3 rounded-xl border border-border/70 p-3'>
            <span className='col-span-12 text-xs font-semibold uppercase tracking-widest text-primary md:col-span-1 md:pb-2'>
              {index === 0 ? 'Principal' : `Respaldo ${index}`}
            </span>
            <NativeSelect
              id={`pasos.${index}.cuenta`}
              label='Cuenta'
              placeholder='Selecciona...'
              opciones={cuentas}
              className='col-span-12 md:col-span-5'
              error={e?.cuenta?.message}
              {...register(`pasos.${index}.cuenta`)}
            />
            <div className='col-span-6 space-y-1.5 md:col-span-2'>
              <label htmlFor={`pasos.${index}.max_intentos`} className='text-sm font-medium text-foreground'>
                Intentos
              </label>
              <Input id={`pasos.${index}.max_intentos`} type='number' min={1} {...register(`pasos.${index}.max_intentos`)} />
              {e?.max_intentos?.message ? <p className='text-xs text-destructive'>{e.max_intentos.message}</p> : null}
            </div>
            <div className='col-span-6 space-y-1.5 md:col-span-2'>
              <label htmlFor={`pasos.${index}.espera_ms`} className='text-sm font-medium text-foreground'>
                Espera base (ms)
              </label>
              <Input id={`pasos.${index}.espera_ms`} type='number' min={0} {...register(`pasos.${index}.espera_ms`)} />
              {e?.espera_ms?.message ? <p className='text-xs text-destructive'>{e.espera_ms.message}</p> : null}
            </div>
            <div className='col-span-12 flex justify-end gap-1 md:col-span-2'>
              <Buttons type='button' size='icon-sm' variant='ghost' aria-label='Subir' disabled={index === 0} onClick={() => move(index, index - 1)}>
                <HiOutlineArrowUp className='h-4 w-4' />
              </Buttons>
              <Buttons
                type='button'
                size='icon-sm'
                variant='ghost'
                aria-label='Bajar'
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}>
                <HiOutlineArrowDown className='h-4 w-4' />
              </Buttons>
              <Buttons type='button' size='icon-sm' variant='ghost' aria-label='Quitar paso' className='text-destructive' onClick={() => remove(index)}>
                <HiOutlineTrash className='h-4 w-4' />
              </Buttons>
            </div>
          </div>
        );
      })}
      {errorLista?.root?.message || errorLista?.message ? (
        <p className='text-sm text-destructive'>{errorLista.root?.message ?? errorLista.message}</p>
      ) : null}
    </div>
  );
}
