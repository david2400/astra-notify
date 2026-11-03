/** @format */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineBookmark,
  HiOutlineRectangleGroup,
  HiOutlineCodeBracket,
  HiOutlineComputerDesktop,
  HiOutlineDevicePhoneMobile,
  HiOutlineEye,
  HiOutlinePaintBrush,
  HiOutlinePhoto,
  HiOutlineSquares2X2,
  HiOutlineVariable,
} from 'react-icons/hi2';
import {
  MdOutlineCropSquare,
  MdOutlineHorizontalRule,
  MdOutlineImage,
  MdOutlineShare,
  MdOutlineShortText,
  MdOutlineSmartButton,
  MdOutlineTableRows,
  MdOutlineTitle,
  MdOutlineVerticalAlignCenter,
  MdOutlineViewColumn,
  MdOutlineWebAsset,
} from 'react-icons/md';
import { Modal } from '@repo/ui/modals/scenes';
import { crearBloque, PALETA, type AjustesDiseno, type Bloque, type Destino, type Diseno, type TipoBloque } from '../models/diseno';
import { generarHtml } from '../utils/generar-html';
import { actualizar, buscar, desplazar, duplicar, eliminar, insertar, insertarVarios, mover } from '../utils/operaciones';
import { aplicarMarca, type MarcaEditor } from '../models/marca';
import { DialogoGuardarComponente, PanelGuardados, PanelSecciones } from './biblioteca';
import { BibliotecaImagenes } from '../../../../imagenes/components/biblioteca-imagenes';
import { anchoEnCorreo } from '../../../../imagenes/utils/optimizar';
import type { IImagen } from '@/server/domains/administre/imagenes/types';
import { HtmlAislado } from './html-aislado';
import { Lienzo, MIME_MOVER, MIME_NUEVO, type Arrastre } from './lienzo';
import { PanelEstilos, PanelPropiedades } from './panel-propiedades';

const ICONOS: Record<TipoBloque, ReactNode> = {
  encabezado: <MdOutlineTitle className='h-5 w-5' />,
  texto: <MdOutlineShortText className='h-5 w-5' />,
  imagen: <MdOutlineImage className='h-5 w-5' />,
  boton: <MdOutlineSmartButton className='h-5 w-5' />,
  columnas: <MdOutlineViewColumn className='h-5 w-5' />,
  divisor: <MdOutlineHorizontalRule className='h-5 w-5' />,
  espaciador: <MdOutlineVerticalAlignCenter className='h-5 w-5' />,
  redes: <MdOutlineShare className='h-5 w-5' />,
  pie: <MdOutlineWebAsset className='h-5 w-5' />,
  html: <HiOutlineCodeBracket className='h-5 w-5' />,
  tabla: <MdOutlineTableRows className='h-5 w-5' />,
};

const MAX_HISTORIAL = 60;

interface Props {
  diseno: Diseno;
  onChange: (d: Diseno) => void;
  /** Variables declaradas en la plantilla (para Personalizar). */
  variables: string[];
  /** Declara una variable nueva (desde el menú Personalizar). */
  onCrearVariable: (nombre: string) => void;
  /** Contenido de la pestaña "Variables" del panel izquierdo. */
  panelVariables?: ReactNode;
  /** Marca corporativa: la usan las secciones prediseñadas y "Aplicar marca". */
  marca: MarcaEditor;
}

type Pestana = 'bloques' | 'secciones' | 'guardados' | 'imagenes' | 'estilo' | 'variables';

const PESTANAS: { id: Pestana; etiqueta: string; titulo: string; icono: ReactNode }[] = [
  { id: 'bloques', etiqueta: 'Bloques', titulo: 'Bloques básicos', icono: <HiOutlineSquares2X2 className='h-5 w-5' /> },
  { id: 'secciones', etiqueta: 'Secciones', titulo: 'Secciones prediseñadas', icono: <HiOutlineRectangleGroup className='h-5 w-5' /> },
  { id: 'guardados', etiqueta: 'Guardados', titulo: 'Componentes de la empresa', icono: <HiOutlineBookmark className='h-5 w-5' /> },
  { id: 'imagenes', etiqueta: 'Imágenes', titulo: 'Biblioteca de imágenes', icono: <HiOutlinePhoto className='h-5 w-5' /> },
  { id: 'estilo', etiqueta: 'Estilo', titulo: 'Estilo del correo', icono: <HiOutlinePaintBrush className='h-5 w-5' /> },
  { id: 'variables', etiqueta: 'Variables', titulo: 'Variables', icono: <HiOutlineVariable className='h-5 w-5' /> },
];

/** Barra de íconos (como la de Brevo) que cambia el contenido del panel izquierdo. */
/** Bloque imagen a partir de una imagen de la biblioteca (las pequeñas no se estiran: se respeta su ancho). */
function bloqueDeImagen(img: IImagen): Bloque {
  return { ...crearBloque('imagen'), url: img.url, alt: img.alt || img.nombre, ancho: anchoEnCorreo(img.ancho) } as Bloque;
}

function Riel({ actual, onChange, conVariables }: { actual: Pestana; onChange: (p: Pestana) => void; conVariables: boolean }) {
  return (
    <div role='tablist' aria-label='Biblioteca del editor' aria-orientation='vertical' className='flex gap-1 overflow-x-auto border-b border-border bg-muted/40 p-1.5 lg:flex-col lg:border-b-0 lg:border-r'>
      {PESTANAS.filter((p) => conVariables || p.id !== 'variables').map((p) => (
        <button
          key={p.id}
          type='button'
          role='tab'
          aria-selected={actual === p.id}
          title={p.titulo}
          onClick={() => onChange(p.id)}
          className={`flex min-w-14 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            actual === p.id ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
          }`}>
          {p.icono}
          {p.etiqueta}
        </button>
      ))}
    </div>
  );
}

function BotonBarra({ titulo, onClick, disabled, activo, children }: { titulo: string; onClick: () => void; disabled?: boolean; activo?: boolean; children: ReactNode }) {
  return (
    <button
      type='button'
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition disabled:opacity-40 ${activo ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'}`}>
      {children}
    </button>
  );
}

/**
 * Editor de arrastrar y soltar estilo Brevo: bloques a la izquierda, correo en el centro (edición en línea),
 * propiedades del bloque a la derecha. Deshacer/rehacer, vista escritorio/móvil, vista previa y código HTML.
 */
export function EditorVisual({ diseno, onChange, variables, onCrearVariable, panelVariables, marca }: Props) {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre>(null);
  const [pestana, setPestana] = useState<Pestana>('bloques');
  const [movil, setMovil] = useState(false);
  const [modal, setModal] = useState<'preview' | 'codigo' | null>(null);
  const [aGuardar, setAGuardar] = useState<Bloque[] | null>(null);
  const [versionGuardados, setVersionGuardados] = useState(0);
  const historial = useRef<{ pasado: Diseno[]; futuro: Diseno[] }>({ pasado: [], futuro: [] });
  const [, forzar] = useState(0);
  const actual = useRef(diseno);
  actual.current = diseno;

  /** Aplica un cambio y lo guarda en el historial. */
  const aplicar = useCallback(
    (fn: (d: Diseno) => Diseno) => {
      const antes = actual.current;
      const despues = fn(antes);
      if (despues === antes) return;
      historial.current.pasado = [...historial.current.pasado.slice(-(MAX_HISTORIAL - 1)), antes];
      historial.current.futuro = [];
      onChange(despues);
      forzar((n) => n + 1);
    },
    [onChange],
  );

  const deshacer = useCallback(() => {
    const h = historial.current;
    const previo = h.pasado[h.pasado.length - 1];
    if (!previo) return;
    h.pasado = h.pasado.slice(0, -1);
    h.futuro = [actual.current, ...h.futuro];
    onChange(previo);
    forzar((n) => n + 1);
  }, [onChange]);

  const rehacer = useCallback(() => {
    const h = historial.current;
    const siguiente = h.futuro[0];
    if (!siguiente) return;
    h.futuro = h.futuro.slice(1);
    h.pasado = [...h.pasado, actual.current];
    onChange(siguiente);
    forzar((n) => n + 1);
  }, [onChange]);

  const agregar = (tipo: TipoBloque, destino?: Destino) => {
    const bloque = crearBloque(tipo);
    const sel = seleccionado ? buscar(actual.current, seleccionado) : null;
    // Sin destino: después del bloque seleccionado (o al final).
    const d: Destino =
      destino ??
      (sel && !(tipo === 'columnas' && sel.ubicacion.padre)
        ? { padre: sel.ubicacion.padre, indice: sel.ubicacion.indice + 1 }
        : { padre: null, indice: actual.current.bloques.length });
    aplicar((x) => insertar(x, d, bloque));
    setSeleccionado(bloque.id);
  };

  /** Inserta una sección o componente guardado (sin destino: debajo del bloque seleccionado o al final). */
  const agregarVarios = (bloques: Bloque[], destino?: Destino) => {
    if (!bloques.length) return;
    const sel = seleccionado ? buscar(actual.current, seleccionado) : null;
    const d: Destino =
      destino ??
      (sel ? { padre: sel.ubicacion.padre, indice: sel.ubicacion.indice + 1 } : { padre: null, indice: actual.current.bloques.length });
    aplicar((x) => insertarVarios(x, d, bloques));
    // Se selecciona el último: la siguiente sección se agrega a continuación, sin partir esta
    setSeleccionado(bloques[bloques.length - 1]!.id);
    // Declara las variables {{...}} que trae la sección (tipo y validación se ajustan en el paso Variables)
    const usadas = new Set<string>();
    for (const m of JSON.stringify(bloques).matchAll(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]{0,49})\s*\}\}/g)) if (m[1]) usadas.add(m[1]);
    usadas.forEach((n) => !variables.includes(n) && onCrearVariable(n));
  };

  const soltar = (destino: Destino) => {
    const a = arrastre;
    setArrastre(null);
    if (!a) return;
    if (a.clase === 'nuevo') agregar(a.tipo, destino);
    else if (a.clase === 'seccion') agregarVarios(a.bloques, destino);
    else aplicar((x) => mover(x, a.id, destino));
  };

  const acciones = {
    seleccionado,
    seleccionar: setSeleccionado,
    actualizar: (id: string, cambios: Partial<Bloque>) => aplicar((x) => actualizar(x, id, cambios)),
    eliminar: (id: string) => {
      aplicar((x) => eliminar(x, id));
      setSeleccionado(null);
    },
    duplicar: (id: string) => {
      let nuevo: string | null = null;
      aplicar((x) => {
        const r = duplicar(x, id);
        nuevo = r.nuevoId;
        return r.diseno;
      });
      if (nuevo) setSeleccionado(nuevo);
    },
    desplazar: (id: string, delta: -1 | 1) => aplicar((x) => desplazar(x, id, delta)),
    soltar,
    arrastre,
    setArrastre,
    variables,
    onCrearVariable,
    movil,
    guardarComponente: (id: string) => {
      const b = buscar(actual.current, id)?.bloque;
      if (b) setAGuardar([b]);
    },
  };

  // Atajos: Ctrl+Z / Ctrl+Y y Supr (solo fuera de campos de texto)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const escribiendo = t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
      if (escribiendo) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) rehacer();
        else deshacer();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        rehacer();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && seleccionado) {
        e.preventDefault();
        aplicar((x) => eliminar(x, seleccionado));
        setSeleccionado(null);
      } else if (e.key === 'Escape') {
        setSeleccionado(null);
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aplicar, deshacer, rehacer, seleccionado]);

  const bloqueSel = seleccionado ? buscar(diseno, seleccionado)?.bloque ?? null : null;
  const html = useMemo(() => (modal ? generarHtml(diseno) : ''), [modal, diseno]);
  const setAjustes = (cambios: Partial<AjustesDiseno>) => aplicar((x) => ({ ...x, ajustes: { ...x.ajustes, ...cambios } }));

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-card'>
      {/* Barra superior */}
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2'>
        <div className='flex items-center gap-1 rounded-xl bg-muted p-1'>
          <BotonBarra titulo='Deshacer (Ctrl+Z)' onClick={deshacer} disabled={!historial.current.pasado.length}>
            <HiOutlineArrowUturnLeft className='h-4 w-4' />
          </BotonBarra>
          <BotonBarra titulo='Rehacer (Ctrl+Y)' onClick={rehacer} disabled={!historial.current.futuro.length}>
            <HiOutlineArrowUturnRight className='h-4 w-4' />
          </BotonBarra>
        </div>
        <div className='flex items-center gap-1 rounded-xl bg-muted p-1' role='group' aria-label='Dispositivo'>
          <BotonBarra titulo='Vista de escritorio' activo={!movil} onClick={() => setMovil(false)}>
            <HiOutlineComputerDesktop className='h-4 w-4' />
            <span className='hidden sm:inline'>Escritorio</span>
          </BotonBarra>
          <BotonBarra titulo='Vista móvil' activo={movil} onClick={() => setMovil(true)}>
            <HiOutlineDevicePhoneMobile className='h-4 w-4' />
            <span className='hidden sm:inline'>Móvil</span>
          </BotonBarra>
        </div>
        <div className='flex items-center gap-1 rounded-xl bg-muted p-1'>
          <BotonBarra titulo='Vista previa del correo' onClick={() => setModal('preview')}>
            <HiOutlineEye className='h-4 w-4' />
            <span className='hidden sm:inline'>Vista previa</span>
          </BotonBarra>
          <BotonBarra titulo='Guardar todo el diseño como componente reutilizable' onClick={() => setAGuardar(diseno.bloques)} disabled={!diseno.bloques.length}>
            <HiOutlineBookmark className='h-4 w-4' />
            <span className='hidden sm:inline'>Guardar como componente</span>
          </BotonBarra>
          <BotonBarra titulo='Ver código HTML generado' onClick={() => setModal('codigo')}>
            <HiOutlineCodeBracket className='h-4 w-4' />
            <span className='hidden sm:inline'>HTML</span>
          </BotonBarra>
        </div>
      </div>

      <div className='grid min-h-[680px] lg:grid-cols-[72px_270px_minmax(0,1fr)_300px]'>
        <Riel actual={pestana} onChange={setPestana} conVariables={Boolean(panelVariables)} />
        {/* Panel izquierdo: biblioteca */}
        <aside className='space-y-4 border-b border-border p-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r'>
          <h3 className='text-sm font-semibold text-foreground'>{PESTANAS.find((p) => p.id === pestana)?.titulo}</h3>
          {pestana === 'secciones' ? <PanelSecciones marca={marca} onArrastre={setArrastre} onInsertar={(b) => agregarVarios(b)} /> : null}
          {pestana === 'guardados' ? <PanelGuardados marca={marca} version={versionGuardados} onArrastre={setArrastre} onInsertar={(b) => agregarVarios(b)} /> : null}
          {pestana === 'imagenes' ? (
            <BibliotecaImagenes
              modo='seleccionar'
              compacto
              onSeleccionar={(img) => agregarVarios([bloqueDeImagen(img)])}
              onArrastrar={(img, dt) => {
                if (!img) return setArrastre(null);
                dt?.setData(MIME_NUEVO, 'imagen');
                setArrastre({ clase: 'seccion', bloques: [bloqueDeImagen(img)], tipo: 'imagen' });
              }}
            />
          ) : null}
          {pestana === 'bloques' ? (
            <div>
              <p className='mb-2 text-xs text-muted-foreground'>Arrastra un bloque al correo o haz clic para agregarlo debajo del seleccionado.</p>
              <div className='grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-2'>
                {PALETA.map((p) => (
                  <button
                    key={p.tipo}
                    type='button'
                    draggable
                    title={p.descripcion}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(MIME_NUEVO, p.tipo);
                      e.dataTransfer.effectAllowed = 'copy';
                      setArrastre({ clase: 'nuevo', tipo: p.tipo });
                    }}
                    onDragEnd={() => setArrastre(null)}
                    onClick={() => agregar(p.tipo)}
                    className='flex cursor-grab flex-col items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-3 text-center text-xs font-medium text-foreground transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing'>
                    <span className='text-primary'>{ICONOS[p.tipo]}</span>
                    {p.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {pestana === 'estilo' ? (
            <div className='space-y-4'>
              <button
                type='button'
                onClick={() => aplicar((x) => aplicarMarca(x, marca))}
                className='flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/50 hover:shadow-sm'>
                <span className='flex shrink-0 gap-0.5' aria-hidden='true'>
                  {[marca.color_primario, marca.color_secundario, marca.color_texto].map((c) => (
                    <span key={c} className='h-6 w-3 rounded-sm border border-border' style={{ background: c }} />
                  ))}
                </span>
                <span>
                  <span className='block text-sm font-semibold text-foreground'>Aplicar marca corporativa</span>
                  <span className='block text-[11px] text-muted-foreground'>Colores, fuente y fondos de {marca.nombre_empresa}</span>
                </span>
              </button>
              <PanelEstilos ajustes={diseno.ajustes} onChange={setAjustes} />
            </div>
          ) : null}
          {pestana === 'variables' ? panelVariables : null}
        </aside>

        {/* Lienzo */}
        <div className='relative min-w-0 bg-muted/30' data-movil={movil}>
          <Lienzo diseno={diseno} acciones={acciones} />
          {/* Recibe el soltar fuera de las zonas: se agrega al final */}
          {arrastre ? (
            <div
              className='absolute inset-x-0 bottom-0 h-16'
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes(MIME_NUEVO) || e.dataTransfer.types.includes(MIME_MOVER)) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                soltar({ padre: null, indice: actual.current.bloques.length });
              }}
            />
          ) : null}
        </div>

        {/* Panel derecho */}
        <aside className='border-t border-border p-4 lg:border-l lg:border-t-0'>
          {bloqueSel ? (
            <PanelPropiedades
              key={bloqueSel.id}
              bloque={bloqueSel}
              variables={variables}
              onChange={(c) => acciones.actualizar(bloqueSel.id, c)}
              onCerrar={() => setSeleccionado(null)}
              onEliminar={() => acciones.eliminar(bloqueSel.id)}
            />
          ) : (
            <div className='space-y-3 text-sm text-muted-foreground'>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                <MdOutlineCropSquare className='h-6 w-6' />
              </div>
              <p className='font-medium text-foreground'>Selecciona un bloque</p>
              <p className='text-xs leading-5'>
                Haz clic en un bloque del correo para editar su contenido y estilo. Arrastra el ícono ⋮⋮ de la izquierda para moverlo. Atajos: <kbd className='rounded border px-1'>Supr</kbd> elimina,{' '}
                <kbd className='rounded border px-1'>Ctrl+Z</kbd> deshace.
              </p>
              <p className='text-xs'>{diseno.bloques.length} bloques en el correo.</p>
            </div>
          )}
        </aside>
      </div>

      <DialogoGuardarComponente bloques={aGuardar} onCerrar={() => setAGuardar(null)} onGuardado={() => setVersionGuardados((v) => v + 1)} />
      <Modal size='xl' title='Vista previa del correo' open={modal === 'preview'} onOpenChange={(o) => !o && setModal(null)} hideDefaultFooter>
        <VistaDispositivos html={html} />
      </Modal>
      <Modal size='xl' title='HTML generado' open={modal === 'codigo'} onOpenChange={(o) => !o && setModal(null)} hideDefaultFooter>
        <div className='space-y-2'>
          <p className='text-xs text-muted-foreground'>Este es el HTML que se guarda en la plantilla y envía el gateway (las variables se reemplazan al enviar).</p>
          <textarea readOnly value={html} rows={20} className='w-full rounded-xl border border-border bg-muted/30 p-3 font-mono text-[11px] leading-5' aria-label='HTML generado' />
          <button
            type='button'
            onClick={() => void navigator.clipboard?.writeText(html)}
            className='rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted'>
            Copiar HTML
          </button>
        </div>
      </Modal>
    </div>
  );
}

/** Vista previa escritorio / móvil del HTML final, aislada en un iframe sin scripts. */
export function VistaDispositivos({ html, alto = 560 }: { html: string; alto?: number }) {
  const [movil, setMovil] = useState(false);
  return (
    <div className='space-y-3'>
      <div className='flex justify-center'>
        <div className='inline-flex rounded-xl bg-muted p-1' role='group' aria-label='Dispositivo'>
          <BotonBarra titulo='Escritorio' activo={!movil} onClick={() => setMovil(false)}>
            <HiOutlineComputerDesktop className='h-4 w-4' /> Escritorio
          </BotonBarra>
          <BotonBarra titulo='Móvil' activo={movil} onClick={() => setMovil(true)}>
            <HiOutlineDevicePhoneMobile className='h-4 w-4' /> Móvil
          </BotonBarra>
        </div>
      </div>
      <div className='flex justify-center rounded-xl bg-muted/40 p-3'>
        <div className={movil ? 'rounded-[2rem] border-[10px] border-slate-800 bg-slate-800 shadow-xl' : 'w-full'}>
          <iframe
            title={movil ? 'Vista previa móvil' : 'Vista previa escritorio'}
            sandbox=''
            srcDoc={html}
            className={`block rounded-xl bg-white ${movil ? 'w-[375px]' : 'w-full'}`}
            style={{ height: alto }}
          />
        </div>
      </div>
    </div>
  );
}

export { HtmlAislado };
