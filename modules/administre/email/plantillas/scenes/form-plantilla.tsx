/** @format */

'use client';

import { useRef, useState, type ChangeEvent, type FocusEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HiOutlineEye, HiOutlinePlus, HiOutlineSparkles, HiOutlineTrash } from 'react-icons/hi2';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Modal } from '@repo/ui/modals/scenes';
import { CheckField } from '../../shared/components/check-field';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { TIPOS_DATO, VARIABLE_DEFAULT, type CampoPlantilla, type ICrearPlantilla } from '../models/plantilla.interface';
import { plantillaSchema, type PlantillaFormValues } from '../schemas/plantilla.schema';
import { aplicarVariables, variablesDePlantilla } from '../utils/variables';
import { PlantillaEmailPreview } from '../components/plantilla-preview';
import { VistaHtml } from '../components/vista-html';

interface Props {
  initialValues: PlantillaFormValues;
  tipos: OpcionSelect[];
  bloquearCodigo?: boolean;
  /** Convierte los valores del formulario al payload del gateway (para la vista previa del borrador). */
  toPayload: (values: PlantillaFormValues) => ICrearPlantilla;
  onSubmit: (values: PlantillaFormValues) => Promise<void>;
}

const NOMBRE = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/;
const ETIQUETA: Record<CampoPlantilla, string> = { asunto: 'asunto', cuerpo_html: 'HTML', cuerpo_texto: 'texto' };

export function FormPlantilla({ initialValues, tipos, bloquearCodigo, toPayload, onSubmit }: Props) {
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

  const asunto = watch('asunto') ?? '';
  const html = watch('cuerpo_html') ?? '';
  const texto = watch('cuerpo_texto') ?? '';
  const variables = watch('variables');
  const usadas = variablesDePlantilla(asunto, html, texto);
  const declaradas = variables.map((v) => v.nombre.trim()).filter(Boolean);
  const faltantes = usadas.filter((u) => !declaradas.includes(u));
  // Declaradas que no se usan: el gateway guarda igual, pero se avisa (como en SMS).
  const sinUsar = [...new Set(declaradas.filter((d) => !usadas.includes(d)))];

  const campoActivo = useRef<CampoPlantilla>('cuerpo_html');
  const seleccion = useRef<Record<CampoPlantilla, { inicio: number; fin: number }>>({
    asunto: { inicio: asunto.length, fin: asunto.length },
    cuerpo_html: { inicio: html.length, fin: html.length },
    cuerpo_texto: { inicio: texto.length, fin: texto.length },
  });
  const nodos = useRef<Partial<Record<CampoPlantilla, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const [campo, setCampo] = useState<CampoPlantilla>('cuerpo_html');
  const [aviso, setAviso] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [vista, setVista] = useState<'html' | 'texto'>('html');
  const [preview, setPreview] = useState<ICrearPlantilla | null>(null);

  const guardarCursor = (c: CampoPlantilla, nodo: HTMLInputElement | HTMLTextAreaElement) => {
    seleccion.current[c] = { inicio: nodo.selectionStart ?? nodo.value.length, fin: nodo.selectionEnd ?? nodo.value.length };
  };
  const recordar = (c: CampoPlantilla) => (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => {
    campoActivo.current = c;
    setCampo(c);
    guardarCursor(c, e.currentTarget);
  };

  /** register() + seguimiento del cursor: al enfocar, seleccionar, escribir, hacer clic y al salir del campo. */
  const enlazar = (c: CampoPlantilla) => {
    const field = register(c);
    return {
      ...field,
      ref: (node: HTMLInputElement | HTMLTextAreaElement | null) => {
        field.ref(node);
        nodos.current[c] = node;
      },
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const r = field.onChange(e);
        guardarCursor(c, e.target);
        return r;
      },
      onBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        guardarCursor(c, e.target);
        return field.onBlur(e);
      },
      onSelect: recordar(c),
      onFocus: recordar(c),
      onKeyUp: recordar(c),
      onClick: recordar(c),
    };
  };

  /** Inserta {{nombre}} en el último campo enfocado (asunto, HTML o texto), en la posición del cursor. */
  const insertar = (nombre: string) => {
    if (!NOMBRE.test(nombre)) return;
    const c = campoActivo.current;
    const actual = getValues(c) ?? '';
    const nodo = nodos.current[c];
    // Si el campo sigue enfocado (los botones no roban el foco) se usa el cursor real
    if (nodo && typeof document !== 'undefined' && document.activeElement === nodo) guardarCursor(c, nodo);
    const { inicio, fin } = seleccion.current[c];
    const a = Math.min(inicio, actual.length);
    const b = Math.min(fin, actual.length);
    const token = `{{${nombre}}}`;
    setValue(c, actual.slice(0, a) + token + actual.slice(b), { shouldDirty: true, shouldValidate: true });
    seleccion.current[c] = { inicio: a + token.length, fin: a + token.length };
    setAviso(`{{${nombre}}} insertada en el ${ETIQUETA[c]}.`);
    requestAnimationFrame(() => {
      nodo?.focus();
      nodo?.setSelectionRange(a + token.length, a + token.length);
    });
  };

  const agregarVariable = () => {
    const nombre = nuevoNombre.trim();
    if (!NOMBRE.test(nombre)) {
      setAviso('Usa un nombre que empiece por letra, seguido de letras, números o _ (máx. 50).');
      return;
    }
    if (!getValues('variables').some((v) => v.nombre.trim() === nombre)) append({ ...VARIABLE_DEFAULT, nombre });
    insertar(nombre);
    setNuevoNombre('');
  };

  const detectar = () => {
    const ya = getValues('variables').map((v) => v.nombre.trim());
    usadas.filter((u) => !ya.includes(u)).forEach((nombre) => append({ ...VARIABLE_DEFAULT, nombre }));
  };

  const valoresMuestra = Object.fromEntries(variables.map((v) => [v.nombre.trim(), v.valor_defecto]));
  const errorVariables = errors.variables as { root?: { message?: string }; message?: string } | undefined;
  const claseArea = 'w-full resize-y rounded-xl border border-input bg-background p-3 font-mono text-xs leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-12 gap-4'>
        <FormField id='codigo' label='Código' placeholder='Ej. BIENVENIDA' disabled={bloquearCodigo} className='col-span-12 md:col-span-4' error={errors.codigo?.message} {...register('codigo')} />
        <FormField id='nombre' label='Nombre' placeholder='Ej. Correo de bienvenida' className='col-span-12 md:col-span-5' error={errors.nombre?.message} {...register('nombre')} />
        <NativeSelect id='tipo_mensaje' label='Tipo por defecto' placeholder='Lo define el request' opciones={tipos} className='col-span-12 md:col-span-3' {...register('tipo_mensaje')} />
        <FormField id='descripcion' label='Descripción' className='col-span-12' error={errors.descripcion?.message} {...register('descripcion')} />

        <div className='col-span-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
          <section className='space-y-4 rounded-2xl border border-border bg-background p-4'>
            <div className='space-y-1.5'>
              <label htmlFor='asunto' className='text-sm font-semibold'>Asunto</label>
              <Input id='asunto' placeholder='Hola {{nombre}}, bienvenido' aria-invalid={Boolean(errors.asunto)} {...enlazar('asunto')} />
              {errors.asunto?.message ? <p className='text-xs text-destructive'>{errors.asunto.message}</p> : null}
            </div>
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <label htmlFor='cuerpo_html' className='text-sm font-semibold'>Cuerpo HTML</label>
                <span className='text-xs text-muted-foreground'>Los valores de las variables se escapan (seguro ante HTML/JS).</span>
              </div>
              <textarea id='cuerpo_html' rows={12} placeholder='<h2>Hola {{nombre}}</h2><p>...</p>' className={claseArea} {...enlazar('cuerpo_html')} />
              {errors.cuerpo_html?.message ? <p className='text-xs text-destructive'>{errors.cuerpo_html.message}</p> : null}
            </div>
            <div className='space-y-1.5'>
              <label htmlFor='cuerpo_texto' className='text-sm font-semibold'>Texto plano (alternativa al HTML)</label>
              <textarea id='cuerpo_texto' rows={5} placeholder='Hola {{nombre}}...' className={claseArea} {...enlazar('cuerpo_texto')} />
            </div>
            {faltantes.length > 0 ? (
              <p className='rounded-lg border border-border bg-muted/40 p-3 text-sm'>
                Variables pendientes de declarar: <strong>{faltantes.join(', ')}</strong>. Usa «Detectar del contenido».
              </p>
            ) : null}
            {sinUsar.length > 0 ? (
              <p role='status' className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm'>
                Variables declaradas que no se usan en asunto, HTML ni texto: <strong>{sinUsar.join(', ')}</strong>. Insértalas o quítalas.
              </p>
            ) : null}
          </section>

          <aside className='space-y-4 rounded-2xl border border-border bg-muted/20 p-4'>
            <div>
              <h3 className='font-semibold'>Variables</h3>
              <p className='mt-1 text-xs text-muted-foreground'>
                Pulsa para insertar en el <strong>{ETIQUETA[campo]}</strong> (último campo enfocado), en la posición del cursor.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              {variables
                .filter((v, i, lista) => NOMBRE.test(v.nombre.trim()) && lista.findIndex((x) => x.nombre.trim() === v.nombre.trim()) === i)
                .map((v) => {
                  const nombre = v.nombre.trim();
                  const libre = sinUsar.includes(nombre);
                  return (
                    <button
                      key={nombre}
                      type='button'
                      disabled={isSubmitting}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertar(nombre)}
                      aria-label={`Insertar variable ${nombre}`}
                      className={`rounded-lg border px-3 py-2 font-mono text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        libre
                          ? 'border-dashed border-amber-500/60 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300'
                          : 'border-primary/25 bg-primary/5 text-primary hover:bg-primary/15'
                      }`}>
                      {`{{${nombre}}}`}
                      {libre ? ' · sin usar' : ''}
                    </button>
                  );
                })}
              {!variables.length ? <p className='text-sm text-muted-foreground'>Crea tu primera variable para personalizar el email.</p> : null}
            </div>
            <div className='space-y-2 border-t border-border pt-4'>
              <label htmlFor='nueva-variable' className='text-sm font-medium'>Nueva variable</label>
              <Input
                id='nueva-variable'
                placeholder='Ej. nombre_cliente'
                value={nuevoNombre}
                disabled={isSubmitting}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    agregarVariable();
                  }
                }}
              />
              <Buttons type='button' size='sm' variant='outline' className='w-full' disabled={isSubmitting || !nuevoNombre.trim()} onMouseDown={(e) => e.preventDefault()} onClick={agregarVariable}>
                <HiOutlinePlus className='h-4 w-4' /> Crear e insertar
              </Buttons>
            </div>
            <p role='status' aria-live='polite' className='text-xs text-muted-foreground'>{aviso}</p>
          </aside>

          <section className='space-y-3 rounded-2xl border border-border bg-muted/20 p-4 lg:col-span-2'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h3 className='text-sm font-semibold'>Vista previa en vivo (valores por defecto)</h3>
              <div className='flex gap-2'>
                <Buttons type='button' size='sm' variant={vista === 'html' ? 'default' : 'outline'} onClick={() => setVista('html')}>HTML</Buttons>
                <Buttons type='button' size='sm' variant={vista === 'texto' ? 'default' : 'outline'} onClick={() => setVista('texto')}>Texto</Buttons>
                <Buttons type='button' size='sm' variant='outline' onClick={() => setPreview(toPayload(getValues()))}>
                  <HiOutlineEye className='h-4 w-4' /> Validar en el gateway
                </Buttons>
              </div>
            </div>
            <p className='rounded-lg border border-border bg-background p-3 text-sm'>
              <span className='text-xs uppercase tracking-wider text-muted-foreground'>Asunto: </span>
              <strong>{aplicarVariables(asunto, valoresMuestra) || '—'}</strong>
            </p>
            {vista === 'html' ? (
              <VistaHtml html={aplicarVariables(html, valoresMuestra, true)} alto={360} />
            ) : (
              <p className='whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-sm leading-7'>
                {aplicarVariables(texto, valoresMuestra) || 'Sin texto plano (el cliente de correo mostrará el HTML).'}
              </p>
            )}
          </section>
        </div>
      </div>

      <div className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <p className='text-sm font-medium text-foreground'>
            Variables <span className='text-muted-foreground'>({usadas.length} usadas)</span>
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
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.nombre`}>Nombre</label>
                <Input id={`variables.${index}.nombre`} {...register(`variables.${index}.nombre`)} />
                {e?.nombre?.message ? <p className='text-xs text-destructive'>{e.nombre.message}</p> : null}
                {!e?.nombre?.message && sinUsar.includes(variables[index]?.nombre.trim() ?? '') ? (
                  <p className='text-xs text-amber-700 dark:text-amber-300'>No se usa en el contenido</p>
                ) : null}
              </div>
              <NativeSelect id={`variables.${index}.tipo_dato`} label='Tipo' opciones={TIPOS_DATO} className='col-span-6 md:col-span-2' {...register(`variables.${index}.tipo_dato`)} />
              <div className='col-span-6 space-y-1.5 md:col-span-2'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.longitud_maxima`}>Long. máx.</label>
                <Input id={`variables.${index}.longitud_maxima`} inputMode='numeric' {...register(`variables.${index}.longitud_maxima`)} />
                {e?.longitud_maxima?.message ? <p className='text-xs text-destructive'>{e.longitud_maxima.message}</p> : null}
              </div>
              <div className='col-span-12 space-y-1.5 md:col-span-3'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.valor_defecto`}>Valor por defecto</label>
                <Input id={`variables.${index}.valor_defecto`} {...register(`variables.${index}.valor_defecto`)} />
              </div>
              <div className='col-span-12 flex items-center justify-between gap-2 md:col-span-2 md:pb-2'>
                <CheckField id={`variables.${index}.obligatoria`} label='Obligatoria' {...register(`variables.${index}.obligatoria`)} />
                <Buttons type='button' size='icon-sm' variant='ghost' aria-label='Quitar variable' className='text-destructive' onClick={() => remove(index)}>
                  <HiOutlineTrash className='h-4 w-4' />
                </Buttons>
              </div>
              <div className='col-span-12 space-y-1.5 md:col-span-5'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.patron`}>Patrón (regex, opcional)</label>
                <Input id={`variables.${index}.patron`} placeholder='Ej. \d{6}' {...register(`variables.${index}.patron`)} />
              </div>
              <div className='col-span-12 space-y-1.5 md:col-span-7'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.descripcion`}>Descripción</label>
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

      <Modal size='xl' title='Validar en el gateway' open={preview !== null} onOpenChange={(open) => !open && setPreview(null)} hideDefaultFooter>
        {preview ? <PlantillaEmailPreview borrador={preview} /> : null}
      </Modal>
    </form>
  );
}
