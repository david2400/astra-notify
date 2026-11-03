/** @format */

'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FocusEvent, type ReactNode } from 'react';
import { useFieldArray, useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import {
  HiCheck,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCodeBracket,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlinePaperAirplane,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineSquares2X2,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Modal } from '@repo/ui/modals/scenes';
import { CheckField } from '../../shared/components/check-field';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { FormEnvioPrueba } from '../../envios/scenes/form-envio-prueba';
import { DetalleEnvio } from '../../envios/components/detalle-envio';
import { TIPOS_DATO, VARIABLE_DEFAULT, type CampoPlantilla, type ICrearPlantilla } from '../models/plantilla.interface';
import { plantillaSchema, type PlantillaFormValues } from '../schemas/plantilla.schema';
import { aplicarVariables, variablesDePlantilla } from '../utils/variables';
import { PlantillaEmailPreview } from '../components/plantilla-preview';
import { VistaHtml } from '../components/vista-html';
import { crearBloque, disenoVacio, leerDiseno, type Diseno } from '../editor/models/diseno';
import { generarHtml, generarTexto } from '../editor/utils/generar-html';
import { EditorVisual, VistaDispositivos } from '../editor/components/editor-visual';
import { GaleriaInicio } from '../editor/components/galeria-inicio';
import { aplicarMarca, type MarcaEditor } from '../editor/models/marca';
import { SelectorVariables } from '../editor/components/selector-variables';
import { PanelCalidad } from '../components/panel-calidad';

interface Props {
  initialValues: PlantillaFormValues;
  tipos: OpcionSelect[];
  bloquearCodigo?: boolean;
  /** Plantilla nueva (empieza con el editor visual vacío). */
  nueva?: boolean;
  /** Marca corporativa (secciones prediseñadas, estilos por defecto). */
  marca: MarcaEditor;
  /** Convierte los valores del formulario al payload del gateway (para la vista previa del borrador). */
  toPayload: (values: PlantillaFormValues) => ICrearPlantilla;
  onSubmit: (values: PlantillaFormValues) => Promise<void>;
}

type Paso = 'configuracion' | 'diseno' | 'variables' | 'revision';
type Modo = 'bloques' | 'html';

const NOMBRE = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/;
const ETIQUETA: Record<CampoPlantilla, string> = { asunto: 'asunto', cuerpo_html: 'HTML', cuerpo_texto: 'texto' };
const PASOS: { id: Paso; titulo: string; descripcion: string }[] = [
  { id: 'configuracion', titulo: 'Configuración', descripcion: 'Código, nombre y asunto' },
  { id: 'diseno', titulo: 'Diseño', descripcion: 'Contenido del correo' },
  { id: 'variables', titulo: 'Variables', descripcion: 'Tipos y validaciones' },
  { id: 'revision', titulo: 'Revisión', descripcion: 'Vista previa y guardar' },
];
/** Campos del formulario que se editan en cada paso (para llevar al usuario al error). */
const CAMPOS_PASO: Record<Paso, (keyof PlantillaFormValues)[]> = {
  configuracion: ['codigo', 'nombre', 'descripcion', 'tipo_mensaje', 'asunto'],
  diseno: ['cuerpo_html', 'diseno_json'],
  variables: ['variables'],
  revision: ['cuerpo_texto', 'comentario_cambio'],
};

function Aviso({ tono, children }: { tono: 'info' | 'alerta' | 'error'; children: ReactNode }) {
  const clase =
    tono === 'error'
      ? 'border-destructive/40 bg-destructive/5 text-destructive'
      : tono === 'alerta'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
        : 'border-border bg-muted/40 text-foreground';
  return (
    <p role='status' className={`rounded-lg border p-3 text-sm ${clase}`}>
      {children}
    </p>
  );
}

/**
 * Editor de plantillas de email estilo Brevo, por pasos: galería de inicio → configuración → diseño (arrastrar y
 * soltar o HTML) → variables → revisión (vista previa escritorio/móvil, texto plano, validación y prueba).
 */
export function FormPlantilla({ initialValues, tipos, bloquearCodigo, nueva, marca, toPayload, onSubmit }: Props) {
  const {
    control,
    register,
    watch,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PlantillaFormValues>({ resolver: zodResolver(plantillaSchema), defaultValues: initialValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'variables' });

  const disenoInicial = useMemo(() => leerDiseno(initialValues.diseno_json), [initialValues.diseno_json]);
  const [modo, setModo] = useState<Modo>(disenoInicial || nueva ? 'bloques' : 'html');
  const [diseno, setDiseno] = useState<Diseno>(disenoInicial ?? aplicarMarca(disenoVacio(), marca));
  const [paso, setPaso] = useState<Paso>('configuracion');
  const [galeria, setGaleria] = useState(false);
  const textoAuto = modo === 'bloques' && diseno.textoAutomatico !== false;
  const setTextoAuto = (v: boolean) => setDiseno((d) => (d.textoAutomatico === v ? d : { ...d, textoAutomatico: v }));
  const primeraSync = useRef(true);
  const [visitados, setVisitados] = useState<Set<Paso>>(new Set([paso]));

  const asunto = watch('asunto') ?? '';
  const html = watch('cuerpo_html') ?? '';
  const texto = watch('cuerpo_texto') ?? '';
  const variables = watch('variables');
  const usadas = variablesDePlantilla(asunto, html, texto);
  const declaradas = variables.map((v) => v.nombre.trim()).filter(Boolean);
  const nombresValidos = [...new Set(declaradas.filter((n) => NOMBRE.test(n)))];
  const faltantes = usadas.filter((u) => !declaradas.includes(u));
  // Obligatorias que no se usan: el gateway guarda igual, pero se avisa (en SMS no deja guardar).
  const noUsadas = variables.filter((v) => v.nombre.trim() && !usadas.includes(v.nombre.trim()));
  const sinUsar = [...new Set(noUsadas.filter((v) => v.obligatoria).map((v) => v.nombre.trim()))];
  const opcionalesSinUsar = [...new Set(noUsadas.filter((v) => !v.obligatoria).map((v) => v.nombre.trim()))];

  // En modo bloques el HTML y el texto plano se generan del diseño (el gateway envía cuerpo_html).
  useEffect(() => {
    if (modo !== 'bloques') return;
    // La primera sincronización (al abrir) no cuenta como cambio del usuario.
    const shouldDirty = !primeraSync.current;
    primeraSync.current = false;
    setValue('cuerpo_html', diseno.bloques.length ? generarHtml(diseno, getValues('asunto')) : '', { shouldDirty });
    setValue('diseno_json', JSON.stringify(diseno), { shouldDirty });
    if (textoAuto) setValue('cuerpo_texto', generarTexto(diseno), { shouldDirty });
  }, [modo, diseno, textoAuto, setValue, getValues]);

  useEffect(() => {
    if (modo === 'html') setValue('diseno_json', '', { shouldDirty: true });
  }, [modo, setValue]);

  // Aviso al salir con cambios sin guardar
  useEffect(() => {
    if (!isDirty || isSubmitting) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [isDirty, isSubmitting]);

  /* ---------- Inserción de variables en asunto / HTML / texto (campos de texto) ---------- */
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
  const [probando, setProbando] = useState(false);
  const [envioPrueba, setEnvioPrueba] = useState<string | null>(null);

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
        if (c === 'cuerpo_texto' && modo === 'bloques') setTextoAuto(false);
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

  /** Inserta {{nombre}} en el campo indicado (o el último enfocado), en la posición del cursor. */
  const insertar = (nombre: string, destino?: CampoPlantilla) => {
    if (!NOMBRE.test(nombre)) return;
    const c = destino ?? campoActivo.current;
    const actual = getValues(c) ?? '';
    const nodo = nodos.current[c];
    if (nodo && typeof document !== 'undefined' && document.activeElement === nodo) guardarCursor(c, nodo);
    const { inicio, fin } = seleccion.current[c];
    const a = Math.min(inicio, actual.length);
    const b = Math.min(fin, actual.length);
    const token = `{{${nombre}}}`;
    setValue(c, actual.slice(0, a) + token + actual.slice(b), { shouldDirty: true, shouldValidate: true });
    if (c === 'cuerpo_texto' && modo === 'bloques') setTextoAuto(false);
    seleccion.current[c] = { inicio: a + token.length, fin: a + token.length };
    setAviso(`{{${nombre}}} insertada en el ${ETIQUETA[c]}.`);
    requestAnimationFrame(() => {
      nodo?.focus();
      nodo?.setSelectionRange(a + token.length, a + token.length);
    });
  };

  const declarar = (nombre: string) => {
    const n = nombre.trim();
    if (!NOMBRE.test(n)) return false;
    if (!getValues('variables').some((v) => v.nombre.trim() === n)) append({ ...VARIABLE_DEFAULT, nombre: n });
    return true;
  };

  const agregarVariable = () => {
    if (!declarar(nuevoNombre)) {
      setAviso('Usa un nombre que empiece por letra, seguido de letras, números o _ (máx. 50).');
      return;
    }
    if (modo === 'html') insertar(nuevoNombre.trim());
    else setAviso(`Variable {{${nuevoNombre.trim()}}} creada. Insértala con «Personalizar» en el texto.`);
    setNuevoNombre('');
  };

  const detectar = () => {
    const ya = getValues('variables').map((v) => v.nombre.trim());
    usadas.filter((u) => !ya.includes(u)).forEach((nombre) => append({ ...VARIABLE_DEFAULT, nombre }));
  };

  /* ---------- Navegación entre pasos ---------- */
  const ir = (p: Paso) => {
    setPaso(p);
    setVisitados((v) => new Set(v).add(p));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const indice = PASOS.findIndex((p) => p.id === paso);
  const errorEn = (p: Paso) => CAMPOS_PASO[p].some((k) => Boolean(errors[k]));
  const completo: Record<Paso, boolean> = {
    configuracion: Boolean(getValues('codigo')?.trim() && getValues('nombre')?.trim() && asunto.trim()),
    diseno: Boolean(html.trim() || texto.trim()),
    variables: faltantes.length === 0,
    revision: visitados.has('revision'),
  };

  const alFallar = (errs: FieldErrors<PlantillaFormValues>) => {
    const primero = PASOS.find((p) => CAMPOS_PASO[p.id].some((k) => Boolean(errs[k])));
    if (primero) ir(primero.id);
  };

  /* ---------- Cambio de modo ---------- */
  const elegirGaleria = async (crear: () => Diseno, asuntoSugerido: string) => {
    if (modo === 'bloques' && diseno.bloques.length) {
      const r = await Swal.fire({
        icon: 'warning',
        title: '¿Reemplazar el diseño actual?',
        text: 'La plantilla de inicio reemplaza los bloques que tienes ahora (puedes deshacer con Ctrl+Z solo dentro del editor).',
        showCancelButton: true,
        confirmButtonText: 'Reemplazar',
        cancelButtonText: 'Cancelar',
      });
      if (!r.isConfirmed) return;
    }
    const d = aplicarMarca(crear(), marca);
    setGaleria(false);
    setModo('bloques');
    setDiseno({ ...d, textoAutomatico: true });
    if (!getValues('asunto').trim() && asuntoSugerido) setValue('asunto', asuntoSugerido, { shouldDirty: true });
    // Declara las variables que trae el diseño de inicio
    variablesDePlantilla(asuntoSugerido, generarHtml(d), '').forEach((n) => declarar(n));
    ir('diseno');
  };

  const aHtml = async () => {
    const r = await Swal.fire({
      icon: 'warning',
      title: '¿Editar como código HTML?',
      text: 'El HTML generado pasa al editor de código y se pierde el diseño de bloques (podrás volver a crear uno, pero no recuperar este).',
      showCancelButton: true,
      confirmButtonText: 'Sí, editar HTML',
      cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;
    setModo('html');
  };

  const aBloques = async () => {
    const actual = getValues('cuerpo_html').trim();
    if (actual) {
      const r = await Swal.fire({
        icon: 'question',
        title: '¿Usar el editor visual?',
        text: 'Tu HTML actual se conserva dentro de un bloque "HTML" que podrás mover y combinar con bloques nuevos.',
        showCancelButton: true,
        confirmButtonText: 'Usar editor visual',
        cancelButtonText: 'Cancelar',
      });
      if (!r.isConfirmed) return;
    }
    const d = disenoVacio();
    if (actual) {
      const cuerpo = /<body[^>]*>([\s\S]*)<\/body>/i.exec(actual)?.[1] ?? actual;
      const bloque = crearBloque('html');
      if (bloque.tipo === 'html') bloque.codigo = cuerpo.trim();
      d.bloques = [bloque];
    }
    setDiseno({ ...d, textoAutomatico: !getValues('cuerpo_texto').trim() });
    setModo('bloques');
  };

  const valoresMuestra = Object.fromEntries(variables.map((v) => [v.nombre.trim(), v.valor_defecto]));
  const htmlMuestra = aplicarVariables(html, valoresMuestra, true);
  const errorVariables = errors.variables as { root?: { message?: string }; message?: string } | undefined;
  const claseArea =
    'w-full resize-y rounded-xl border border-input bg-background p-3 font-mono text-xs leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring';

  /** Lista rápida de variables (pestaña "Variables" del editor visual). */
  const panelVariables = (
    <div className='space-y-3'>
      <p className='text-xs text-muted-foreground'>
        Inserta variables en el texto con <strong>Personalizar</strong> (barra de formato). Configura su tipo y validación en el paso <strong>Variables</strong>.
      </p>
      <div className='flex flex-wrap gap-1.5'>
        {nombresValidos.length ? (
          nombresValidos.map((n) => (
            <span
              key={n}
              className={`rounded-md border px-2 py-1 font-mono text-[11px] ${sinUsar.includes(n) ? 'border-dashed border-amber-500/60 bg-amber-500/10 text-amber-800 dark:text-amber-200' : 'border-primary/25 bg-primary/5 text-primary'}`}
              title={sinUsar.includes(n) ? 'Obligatoria y aún no se usa' : undefined}>
              {`{{${n}}}`}
            </span>
          ))
        ) : (
          <p className='text-xs text-muted-foreground'>Sin variables.</p>
        )}
      </div>
      <div className='flex gap-1.5'>
        <Input
          placeholder='nueva_variable'
          aria-label='Nombre de la nueva variable'
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              agregarVariable();
            }
          }}
        />
        <Buttons type='button' size='icon' variant='outline' aria-label='Crear variable' disabled={!nuevoNombre.trim()} onClick={agregarVariable}>
          <HiOutlinePlus className='h-4 w-4' />
        </Buttons>
      </div>
      {faltantes.length ? (
        <Buttons type='button' size='sm' variant='outline' className='w-full' onClick={detectar}>
          <HiOutlineSparkles className='h-4 w-4' /> Declarar {faltantes.length} detectada(s)
        </Buttons>
      ) : null}
      <p role='status' aria-live='polite' className='text-xs text-muted-foreground'>
        {aviso}
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit, alFallar)} className='space-y-6'>
      {/* Pasos */}
      <nav aria-label='Pasos de la plantilla'>
        <ol className='grid gap-2 sm:grid-cols-4'>
          {PASOS.map((p, i) => {
            const actual = p.id === paso;
            const conError = errorEn(p.id);
            const hecho = completo[p.id] && visitados.has(p.id) && !conError;
            return (
              <li key={p.id}>
                <button
                  type='button'
                  onClick={() => ir(p.id)}
                  aria-current={actual ? 'step' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    actual ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:bg-muted/50'
                  }`}>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      conError ? 'bg-destructive text-white' : hecho ? 'bg-emerald-600 text-white' : actual ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {conError ? '!' : hecho ? <HiCheck className='h-4 w-4' /> : i + 1}
                  </span>
                  <span className='min-w-0'>
                    <span className='block text-sm font-semibold text-foreground'>{p.titulo}</span>
                    <span className='block truncate text-xs text-muted-foreground'>{p.descripcion}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ---------------- Configuración ---------------- */}
      <section hidden={paso !== 'configuracion'} className='space-y-5'>
        <div className='grid grid-cols-12 gap-4'>
          <FormField id='codigo' label='Código' placeholder='Ej. BIENVENIDA' disabled={bloquearCodigo} className='col-span-12 md:col-span-4' error={errors.codigo?.message} {...register('codigo')} />
          <FormField id='nombre' label='Nombre' placeholder='Ej. Correo de bienvenida' className='col-span-12 md:col-span-5' error={errors.nombre?.message} {...register('nombre')} />
          <NativeSelect id='tipo_mensaje' label='Tipo por defecto' placeholder='Lo define el request' opciones={tipos} className='col-span-12 md:col-span-3' {...register('tipo_mensaje')} />
          <FormField id='descripcion' label='Descripción interna' placeholder='Para qué se usa esta plantilla' className='col-span-12' error={errors.descripcion?.message} {...register('descripcion')} />
        </div>
        <div className='space-y-4 rounded-2xl border border-border bg-background p-4'>
          <div className='space-y-1.5'>
            <label htmlFor='asunto' className='text-sm font-semibold'>
              Asunto
            </label>
            <div className='flex gap-2'>
              <Input id='asunto' placeholder='Hola {{nombre}}, bienvenido' aria-invalid={Boolean(errors.asunto)} {...enlazar('asunto')} />
              <SelectorVariables variables={nombresValidos} onSeleccionar={(n) => insertar(n, 'asunto')} onCrear={(n) => declarar(n)} />
            </div>
            {errors.asunto?.message ? <p className='text-xs text-destructive'>{errors.asunto.message}</p> : null}
            <p className='text-xs text-muted-foreground'>{asunto.length} caracteres. Se recomiendan menos de 60 para que se vea completo en el celular.</p>
          </div>
          {modo === 'bloques' ? (
            <div className='space-y-1.5'>
              <label htmlFor='preheader' className='text-sm font-semibold'>
                Texto de vista previa <span className='font-normal text-muted-foreground'>(opcional)</span>
              </label>
              <Input
                id='preheader'
                placeholder='Aparece junto al asunto en la bandeja de entrada'
                value={diseno.ajustes.preheader}
                maxLength={150}
                onChange={(e) => setDiseno((d) => ({ ...d, ajustes: { ...d.ajustes, preheader: e.target.value } }))}
              />
            </div>
          ) : null}
          {/* Vista de bandeja de entrada */}
          <div className='rounded-xl border border-border bg-muted/30 p-3'>
            <p className='mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>Así se verá en la bandeja de entrada</p>
            <div className='flex items-start gap-3 rounded-lg bg-background p-3 shadow-sm'>
              <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary'>
                {(getValues('nombre') || 'A').trim().charAt(0).toUpperCase()}
              </span>
              <div className='min-w-0 text-sm'>
                <p className='truncate font-semibold text-foreground'>{aplicarVariables(asunto, valoresMuestra) || 'Asunto del correo'}</p>
                <p className='truncate text-muted-foreground'>{modo === 'bloques' && diseno.ajustes.preheader ? diseno.ajustes.preheader : 'Primeras palabras del contenido…'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Diseño ---------------- */}
      <section hidden={paso !== 'diseno'} className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='inline-flex rounded-xl bg-muted p-1' role='group' aria-label='Tipo de editor'>
            <button
              type='button'
              aria-pressed={modo === 'bloques'}
              onClick={() => modo !== 'bloques' && void aBloques()}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${modo === 'bloques' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <HiOutlineSquares2X2 className='h-4 w-4' /> Arrastrar y soltar
            </button>
            <button
              type='button'
              aria-pressed={modo === 'html'}
              onClick={() => modo !== 'html' && void aHtml()}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${modo === 'html' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <HiOutlineCodeBracket className='h-4 w-4' /> Código HTML
            </button>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {errors.cuerpo_html?.message ? <p className='text-sm text-destructive'>{errors.cuerpo_html.message}</p> : null}
            <Buttons type='button' size='sm' variant='outline' onClick={() => setGaleria(true)}>
              <HiOutlineSparkles className='h-4 w-4' /> Plantillas de inicio
            </Buttons>
          </div>
        </div>

        {modo === 'bloques' ? (
          <EditorVisual diseno={diseno} onChange={setDiseno} variables={nombresValidos} onCrearVariable={(n) => declarar(n)} panelVariables={panelVariables} marca={marca} />
        ) : (
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
            <section className='space-y-4 rounded-2xl border border-border bg-background p-4'>
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <label htmlFor='cuerpo_html' className='text-sm font-semibold'>
                    Cuerpo HTML
                  </label>
                  <span className='text-xs text-muted-foreground'>Los valores de las variables se escapan (seguro ante HTML/JS).</span>
                </div>
                <textarea id='cuerpo_html' rows={16} placeholder='<h2>Hola {{nombre}}</h2><p>...</p>' className={claseArea} {...enlazar('cuerpo_html')} />
              </div>
              <div className='space-y-1.5'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <h3 className='text-sm font-semibold'>Vista previa (valores por defecto)</h3>
                  <div className='flex gap-2'>
                    <Buttons type='button' size='sm' variant={vista === 'html' ? 'default' : 'outline'} onClick={() => setVista('html')}>
                      HTML
                    </Buttons>
                    <Buttons type='button' size='sm' variant={vista === 'texto' ? 'default' : 'outline'} onClick={() => setVista('texto')}>
                      Texto
                    </Buttons>
                  </div>
                </div>
                {vista === 'html' ? (
                  <VistaHtml html={htmlMuestra} alto={380} />
                ) : (
                  <p className='whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-sm leading-7'>
                    {aplicarVariables(texto, valoresMuestra) || 'Sin texto plano (el cliente de correo mostrará el HTML).'}
                  </p>
                )}
              </div>
            </section>
            <aside className='space-y-4 rounded-2xl border border-border bg-muted/20 p-4'>
              <div>
                <h3 className='font-semibold'>Variables</h3>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Pulsa para insertar en el <strong>{ETIQUETA[campo]}</strong> (último campo enfocado), en la posición del cursor.
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                {nombresValidos.map((nombre) => {
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
                {!nombresValidos.length ? <p className='text-sm text-muted-foreground'>Crea tu primera variable para personalizar el email.</p> : null}
              </div>
              <div className='space-y-2 border-t border-border pt-4'>
                <label htmlFor='nueva-variable' className='text-sm font-medium'>
                  Nueva variable
                </label>
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
              <p role='status' aria-live='polite' className='text-xs text-muted-foreground'>
                {aviso}
              </p>
            </aside>
          </div>
        )}
        {faltantes.length > 0 ? (
          <Aviso tono='info'>
            Variables pendientes de declarar: <strong>{faltantes.join(', ')}</strong>.{' '}
            <button type='button' className='font-medium text-primary underline' onClick={detectar}>
              Declararlas ahora
            </button>
          </Aviso>
        ) : null}
      </section>

      {/* ---------------- Variables ---------------- */}
      <section hidden={paso !== 'variables'} className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <p className='text-sm font-medium text-foreground'>
              Variables <span className='text-muted-foreground'>({usadas.length} usadas en el contenido)</span>
            </p>
            <p className='text-xs text-muted-foreground'>El gateway valida tipo, obligatoriedad, longitud y patrón antes de enviar. Las no obligatorias pueden quedar fuera del contenido.</p>
          </div>
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
        {sinUsar.length > 0 ? (
          <Aviso tono='alerta'>
            Variables obligatorias que no se usan en asunto ni contenido: <strong>{sinUsar.join(', ')}</strong>. Insértalas, quítalas o desmarca «Obligatoria».
          </Aviso>
        ) : null}
        {!fields.length ? <p className='rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>La plantilla no tiene variables.</p> : null}
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
                  <p className='text-xs text-amber-700 dark:text-amber-300'>Obligatoria y no se usa en el contenido</p>
                ) : null}
                {!e?.nombre?.message && opcionalesSinUsar.includes(variables[index]?.nombre.trim() ?? '') ? (
                  <p className='text-xs text-muted-foreground'>Opcional: se guarda aunque no esté en el contenido</p>
                ) : null}
              </div>
              <NativeSelect id={`variables.${index}.tipo_dato`} label='Tipo' opciones={TIPOS_DATO} className='col-span-6 md:col-span-2' {...register(`variables.${index}.tipo_dato`)} />
              <div className='col-span-6 space-y-1.5 md:col-span-2'>
                <label className='text-sm font-medium text-foreground' htmlFor={`variables.${index}.longitud_maxima`}>
                  Long. máx.
                </label>
                <Input id={`variables.${index}.longitud_maxima`} inputMode='numeric' {...register(`variables.${index}.longitud_maxima`)} />
                {e?.longitud_maxima?.message ? <p className='text-xs text-destructive'>{e.longitud_maxima.message}</p> : null}
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
                <Input id={`variables.${index}.patron`} placeholder='Ej. \d{6}' {...register(`variables.${index}.patron`)} />
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
        {errorVariables?.root?.message || errorVariables?.message ? <p className='text-sm text-destructive'>{errorVariables.root?.message ?? errorVariables.message}</p> : null}
      </section>

      {/* ---------------- Revisión ---------------- */}
      <section hidden={paso !== 'revision'} className='space-y-5'>
        <div className='grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]'>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-border bg-background p-4'>
              <h3 className='mb-3 text-sm font-semibold'>Lista de verificación</h3>
              <ul className='space-y-2 text-sm'>
                {[
                  { ok: Boolean(getValues('codigo')?.trim() && getValues('nombre')?.trim()), texto: 'Código y nombre', paso: 'configuracion' as const },
                  { ok: Boolean(asunto.trim()), texto: 'Asunto', paso: 'configuracion' as const },
                  { ok: Boolean(html.trim() || texto.trim()), texto: 'Contenido del correo', paso: 'diseno' as const },
                  { ok: faltantes.length === 0, texto: faltantes.length ? `Declarar: ${faltantes.join(', ')}` : 'Todas las variables declaradas', paso: 'variables' as const },
                  { ok: sinUsar.length === 0, texto: sinUsar.length ? `Obligatorias sin usar: ${sinUsar.join(', ')}` : 'Variables obligatorias en uso', paso: 'variables' as const, aviso: true },
                  { ok: Boolean(texto.trim()), texto: texto.trim() ? 'Versión de texto plano' : 'Sin texto plano (recomendado)', paso: 'revision' as const, aviso: true },
                ].map((c) => (
                  <li key={c.texto} className='flex items-start gap-2'>
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.ok ? 'bg-emerald-600 text-white' : c.aviso ? 'bg-amber-500 text-white' : 'bg-destructive text-white'}`}>
                      {c.ok ? <HiCheck className='h-3 w-3' /> : <HiOutlineExclamationTriangle className='h-3 w-3' />}
                    </span>
                    <button type='button' onClick={() => ir(c.paso)} className='text-left hover:underline'>
                      {c.texto}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <PanelCalidad asunto={asunto} html={html} texto={texto} tipoMensaje={watch('tipo_mensaje')} />
            <div className='space-y-2 rounded-2xl border border-border bg-background p-4'>
              <h3 className='text-sm font-semibold'>Probar</h3>
              <Buttons type='button' variant='outline' className='w-full' onClick={() => setPreview(toPayload(getValues()))}>
                <HiOutlineEye className='h-4 w-4' /> Validar en el gateway
              </Buttons>
              {bloquearCodigo ? (
                <>
                  <Buttons type='button' variant='outline' className='w-full' onClick={() => setProbando(true)}>
                    <HiOutlinePaperAirplane className='h-4 w-4' /> Enviar prueba
                  </Buttons>
                  <p className='text-[11px] text-muted-foreground'>La prueba usa la versión publicada. Para probar cambios, guárdalos, apruébalos y publícalos, o valida el borrador en el gateway.</p>
                </>
              ) : (
                <p className='text-[11px] text-muted-foreground'>Guarda la plantilla para enviar una prueba real.</p>
              )}
            </div>
          </div>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-border bg-background p-4'>
              <p className='text-xs uppercase tracking-wider text-muted-foreground'>Asunto</p>
              <p className='font-semibold text-foreground'>{aplicarVariables(asunto, valoresMuestra) || '—'}</p>
            </div>
            <VistaDispositivos html={htmlMuestra || '<p style="font-family:sans-serif;color:#888;padding:24px">Sin contenido HTML</p>'} alto={520} />
          </div>
        </div>
        <div className='space-y-2 rounded-2xl border border-border bg-background p-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <label htmlFor='cuerpo_texto' className='text-sm font-semibold'>
              Versión de texto plano
            </label>
            {modo === 'bloques' ? (
              <label className='flex items-center gap-2 text-xs text-muted-foreground'>
                <input type='checkbox' className='h-4 w-4 accent-primary' checked={textoAuto} onChange={(e) => setTextoAuto(e.target.checked)} />
                Generar automáticamente desde el diseño
              </label>
            ) : null}
          </div>
          <p className='text-xs text-muted-foreground'>Se muestra en clientes que no leen HTML y mejora la entrega (filtros antispam).</p>
          <textarea id='cuerpo_texto' rows={7} placeholder='Hola {{nombre}}...' readOnly={modo === 'bloques' && textoAuto} className={`${claseArea} ${modo === 'bloques' && textoAuto ? 'bg-muted/40' : ''}`} {...enlazar('cuerpo_texto')} />
        </div>
        <div className='space-y-2 rounded-2xl border border-border bg-background p-4'>
          <label htmlFor='comentario_cambio' className='text-sm font-semibold'>
            Nota de esta versión <span className='font-normal text-muted-foreground'>(opcional)</span>
          </label>
          <p className='text-xs text-muted-foreground'>Qué cambió y por qué. La ve el revisor y queda en el historial de versiones.</p>
          <textarea id='comentario_cambio' rows={2} maxLength={500} placeholder='Ej.: Actualizo el pie con la nueva dirección' className={claseArea} {...register('comentario_cambio')} />
          {errors.comentario_cambio ? <p className='text-sm text-destructive'>{errors.comentario_cambio.message}</p> : null}
        </div>
      </section>

      {/* Navegación */}
      <div className='sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6'>
        <Buttons type='button' variant='outline' disabled={indice <= 0} onClick={() => indice > 0 && ir(PASOS[indice - 1]!.id)}>
          <HiOutlineArrowLeft className='h-4 w-4' /> Anterior
        </Buttons>
        <div className='flex gap-2'>
          {indice < PASOS.length - 1 ? (
            <Buttons type='button' variant='outline' onClick={() => ir(PASOS[indice + 1]!.id)}>
              Siguiente <HiOutlineArrowRight className='h-4 w-4' />
            </Buttons>
          ) : null}
          <Buttons type='submit' loading={isSubmitting}>
            Guardar plantilla
          </Buttons>
        </div>
      </div>

      <Modal size='xl' title='Plantillas de inicio' open={galeria} onOpenChange={setGaleria} hideDefaultFooter>
        {galeria ? (
          <GaleriaInicio
            onElegir={(g) => void elegirGaleria(g.crear, g.asunto)}
            onHtml={() => {
              setGaleria(false);
              if (modo !== 'html') void aHtml();
            }}
          />
        ) : null}
      </Modal>
      <Modal size='xl' title='Validar en el gateway' open={preview !== null} onOpenChange={(open) => !open && setPreview(null)} hideDefaultFooter>
        {preview ? <PlantillaEmailPreview borrador={preview} /> : null}
      </Modal>
      <Modal size='lg' title='Enviar prueba de la plantilla' open={probando} onOpenChange={setProbando} hideDefaultFooter>
        {probando ? (
          <FormEnvioPrueba
            tipos={tipos}
            plantillas={[{ value: getValues('codigo'), label: `${getValues('codigo')} — ${getValues('nombre')}` }]}
            onEnviado={(id) => {
              setProbando(false);
              setEnvioPrueba(id);
            }}
          />
        ) : null}
      </Modal>
      <Modal size='xl' title='Resultado de la prueba' open={envioPrueba !== null} onOpenChange={(o) => !o && setEnvioPrueba(null)} hideDefaultFooter>
        {envioPrueba ? <DetalleEnvio envioId={envioPrueba} /> : null}
      </Modal>
    </form>
  );
}
