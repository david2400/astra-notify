/** @format */

'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HiOutlinePlus, HiOutlineSparkles, HiOutlineTrash } from 'react-icons/hi2';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { useRef, useState } from 'react';
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
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlantillaFormValues>({ resolver: zodResolver(plantillaSchema), defaultValues: initialValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'variables' });
  const contenido = watch('contenido') ?? '';
  const usadas = variablesDelContenido(contenido);
  const variables = watch('variables');
  const editor = useRef<HTMLTextAreaElement | null>(null);
  const seleccion = useRef({ inicio: contenido.length, fin: contenido.length });
  const [arrastrando, setArrastrando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const contenidoField = register('contenido');
  const faltantes = usadas.filter((nombre) => !variables.some((v) => v.nombre.trim() === nombre));
  // Declaradas que el contenido no usa: el gateway las rechaza al guardar, se avisa antes.
  const sinUsar = [...new Set(variables.map((v) => v.nombre.trim()).filter((n) => n && !usadas.includes(n)))];
  const insertar = (nombre: string) => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nombre)) return;
    const texto = getValues('contenido');
    const inicio = Math.min(seleccion.current.inicio, texto.length);
    const fin = Math.min(seleccion.current.fin, texto.length);
    const token = `{{${nombre}}}`;
    const siguiente = texto.slice(0, inicio) + token + texto.slice(fin);
    if (siguiente.length > 1600) {
      setAviso('No hay espacio para insertar la variable: máximo 1600 caracteres.');
      return;
    }
    setValue('contenido', siguiente, { shouldDirty: true, shouldValidate: true });
    seleccion.current = { inicio: inicio + token.length, fin: inicio + token.length };
    setAviso(`Variable ${nombre} insertada.`);
    requestAnimationFrame(() => {
      editor.current?.focus();
      editor.current?.setSelectionRange(seleccion.current.inicio, seleccion.current.fin);
    });
  };
  const agregarVariable = () => {
    const nombre = nuevoNombre.trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nombre)) {
      setAviso('Usa un nombre que comience con letra o _, seguido de letras, números o _.');
      return;
    }
    const texto = getValues('contenido');
    const reemplazados = Math.min(seleccion.current.fin, texto.length) - Math.min(seleccion.current.inicio, texto.length);
    if (texto.length - reemplazados + nombre.length + 4 > 1600) {
      setAviso('No hay espacio para insertar la variable: máximo 1600 caracteres.');
      return;
    }
    if (!getValues('variables').some((v) => v.nombre.trim() === nombre)) append({ ...VARIABLE_DEFAULT, nombre });
    insertar(nombre);
    setNuevoNombre('');
  };
  const muestra = contenido.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (token, nombre: string) =>
    variables.find((v) => v.nombre.trim() === nombre)?.valor_defecto || token,
  );

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
        <div className='col-span-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
          <section className='space-y-3 rounded-2xl border border-border bg-background p-4'>
            <div className='flex items-center justify-between gap-2'>
              <label htmlFor='contenido' className='text-base font-semibold'>Editor del mensaje</label>
              <span className='text-xs text-muted-foreground'>{contenido.length} / 1600</span>
            </div>
            <p id='contenido-ayuda' className='text-sm text-muted-foreground'>Coloca el cursor y pulsa una variable o arrástrala al editor. Se insertará en la posición del cursor.</p>
            <textarea
              {...contenidoField}
              ref={(node) => { contenidoField.ref(node); editor.current = node; }}
              id='contenido'
              rows={7}
              aria-describedby='contenido-ayuda contenido-error'
              aria-invalid={Boolean(errors.contenido)}
              placeholder='Hola {{nombre}}, tu cita está programada para {{fecha}}.'
              className={`w-full resize-y rounded-xl border p-4 text-sm leading-7 outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${arrastrando ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-input bg-background'}`}
              onSelect={(event) => { seleccion.current = { inicio: event.currentTarget.selectionStart, fin: event.currentTarget.selectionEnd }; }}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes('application/x-plantilla-variable')) {
                  event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setArrastrando(true);
                }
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(event) => {
                setArrastrando(false);
                const nombre = event.dataTransfer.getData('application/x-plantilla-variable');
                if (!nombre) return;
                event.preventDefault();
                if (getValues('variables').some((v) => v.nombre.trim() === nombre)) insertar(nombre);
              }}
            />
            <p id='contenido-error' className='text-sm text-destructive'>{errors.contenido?.message}</p>
            {faltantes.length > 0 && <p className='rounded-lg border border-border bg-muted/40 p-3 text-sm'>Variables pendientes de declarar: {faltantes.join(', ')}. Usa «Detectar del contenido» para configurarlas.</p>}
            {sinUsar.length > 0 && (
              <p role='status' className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm'>
                Variables declaradas que no se usan en el contenido: <strong>{sinUsar.join(', ')}</strong>. Insértalas en el mensaje o quítalas; si no, el gateway no deja guardar la plantilla.
              </p>
            )}
          </section>
          <aside className='space-y-4 rounded-2xl border border-border bg-muted/20 p-4'>
            <div>
              <h3 className='font-semibold'>Variables disponibles</h3>
              <p className='mt-1 text-xs text-muted-foreground'>Pulsa para insertar. También puedes usar Tab y Enter.</p>
            </div>
            <div className='flex flex-wrap gap-2'>
              {variables.filter((v, i, lista) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v.nombre.trim()) && lista.findIndex((x) => x.nombre.trim() === v.nombre.trim()) === i).map((v) => (
                <button
                  key={v.nombre.trim()}
                  type='button'
                  draggable
                  disabled={isSubmitting}
                  onDragStart={(event) => { event.dataTransfer.setData('application/x-plantilla-variable', v.nombre.trim()); event.dataTransfer.effectAllowed = 'copy'; }}
                  onDragEnd={() => setArrastrando(false)}
                  onClick={() => insertar(v.nombre.trim())}
                  aria-label={`Insertar variable ${v.nombre.trim()}`}
                  title={sinUsar.includes(v.nombre.trim()) ? 'Aún no se usa en el contenido' : undefined}
                  className={`cursor-grab rounded-lg border px-3 py-2 font-mono text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${sinUsar.includes(v.nombre.trim()) ? 'border-dashed border-amber-500/60 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300' : 'border-primary/25 bg-primary/5 text-primary hover:bg-primary/15'}`}
                >{`{{${v.nombre.trim()}}}`}{sinUsar.includes(v.nombre.trim()) ? ' · sin usar' : ''}</button>
              ))}
              {!variables.length && <p className='text-sm text-muted-foreground'>Crea tu primera variable para personalizar el mensaje.</p>}
            </div>
            <div className='space-y-2 border-t border-border pt-4'>
              <label htmlFor='nueva-variable' className='text-sm font-medium'>Nueva variable</label>
              <Input id='nueva-variable' placeholder='Ej. nombre_cliente' value={nuevoNombre} disabled={isSubmitting} onChange={(event) => setNuevoNombre(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); agregarVariable(); } }} />
              <Buttons type='button' size='sm' variant='outline' className='w-full' disabled={isSubmitting || !nuevoNombre.trim()} onClick={agregarVariable}><HiOutlinePlus className='h-4 w-4' /> Crear e insertar</Buttons>
            </div>
            <p role='status' aria-live='polite' className='text-xs text-muted-foreground'>{aviso}</p>
          </aside>
          <section className='space-y-3 rounded-2xl border border-border bg-muted/20 p-4 lg:col-span-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h3 className='text-sm font-semibold'>Vista previa en vivo</h3>
              <span className='text-xs text-muted-foreground'>{muestra.length} caracteres · {usadas.length} variables</span>
            </div>
            <p className='whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-sm leading-7'>{muestra || 'Tu mensaje aparecerá aquí mientras lo escribes.'}</p>
            <p className='text-xs text-muted-foreground'>Se utilizan los valores por defecto. La codificación y el número de SMS se calculan en la previsualización del gateway.</p>
          </section>
        </div>
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
                {!e?.nombre?.message && sinUsar.includes(variables[index]?.nombre.trim() ?? '') ? (
                  <p className='text-xs text-amber-700 dark:text-amber-300'>No se usa en el contenido</p>
                ) : null}
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
