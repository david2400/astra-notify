/** @format */

'use client';

import { useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineBookmark, HiOutlineDocumentDuplicate, HiOutlinePhoto, HiOutlineTrash } from 'react-icons/hi2';
import { MdDragIndicator } from 'react-icons/md';
import {
  ANCHOS_DISTRIBUCION,
  PALETA,
  REDES,
  type AjustesDiseno,
  type Bloque,
  type BloqueSimple,
  type Destino,
  type Diseno,
  type TipoBloque,
} from '../models/diseno';
import { urlSegura } from '../utils/sanitizar';
import { HtmlAislado } from './html-aislado';
import { TextoEnriquecido } from './texto-enriquecido';

/** Qué se está arrastrando (dataTransfer no se puede leer durante dragover). */
export type Arrastre =
  | { clase: 'nuevo'; tipo: TipoBloque }
  | { clase: 'mover'; id: string; tipo: TipoBloque }
  /** Sección prediseñada o componente guardado (varios bloques); tipo = 'columnas' si incluye columnas. */
  | { clase: 'seccion'; bloques: Bloque[]; tipo: TipoBloque }
  | null;

export const MIME_NUEVO = 'application/x-astra-bloque';
export const MIME_MOVER = 'application/x-astra-mover';

interface Acciones {
  seleccionado: string | null;
  seleccionar: (id: string | null) => void;
  actualizar: (id: string, cambios: Partial<Bloque>) => void;
  eliminar: (id: string) => void;
  duplicar: (id: string) => void;
  desplazar: (id: string, delta: -1 | 1) => void;
  soltar: (destino: Destino) => void;
  arrastre: Arrastre;
  setArrastre: (a: Arrastre) => void;
  variables: string[];
  onCrearVariable: (nombre: string) => void;
  movil: boolean;
  /** Abre el diálogo para guardar el bloque como componente reutilizable. */
  guardarComponente?: (id: string) => void;
}

const nombreTipo = (t: TipoBloque) => PALETA.find((p) => p.tipo === t)?.etiqueta ?? t;
const TAMANO_TITULO: Record<1 | 2 | 3, number> = { 1: 28, 2: 22, 3: 18 };

/** Línea donde se puede soltar un bloque; se resalta al pasar por encima. */
function ZonaSoltar({ destino, acciones, vacia, texto }: { destino: Destino; acciones: Acciones; vacia?: boolean; texto?: string }) {
  const [encima, setEncima] = useState(false);
  const permitido = acciones.arrastre !== null && !(destino.padre && acciones.arrastre.tipo === 'columnas');
  const sobre = (e: DragEvent) => {
    if (!permitido) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = acciones.arrastre?.clase === 'mover' ? 'move' : 'copy';
    if (!encima) setEncima(true);
  };
  if (vacia) {
    return (
      <div
        onDragOver={sobre}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => {
          e.preventDefault();
          setEncima(false);
          if (permitido) acciones.soltar(destino);
        }}
        className={`flex min-h-20 items-center justify-center rounded-lg border-2 border-dashed px-3 py-6 text-center text-xs transition ${
          encima ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-slate-400'
        }`}>
        {texto ?? 'Arrastra un bloque aquí'}
      </div>
    );
  }
  // Sin alto propio (no mueve el lienzo al empezar a arrastrar): el área de captura sobresale 8px arriba y abajo.
  return (
    <div aria-hidden='true' className='relative h-0'>
      {permitido ? (
        <div
          onDragOver={sobre}
          onDragLeave={() => setEncima(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEncima(false);
            acciones.soltar(destino);
          }}
          className='absolute inset-x-0 -top-2 z-20 h-4'>
          {encima ? <div className='absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(37,99,235,0.2)]' /> : null}
        </div>
      ) : null}
    </div>
  );
}

function BarraBloque({ b, acciones }: { b: Bloque; acciones: Acciones }) {
  const boton = (titulo: string, icono: ReactNode, onClick: () => void, peligro?: boolean) => (
    <button
      type='button'
      title={titulo}
      aria-label={`${titulo} (${nombreTipo(b.tipo)})`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-white/20 ${peligro ? 'hover:bg-red-500' : ''}`}>
      {icono}
    </button>
  );
  return (
    <div className='absolute -right-px -top-8 z-20 flex items-center gap-0.5 rounded-t-lg bg-primary px-1 py-0.5 text-primary-foreground shadow'>
      <span className='px-1.5 text-[11px] font-semibold'>{nombreTipo(b.tipo)}</span>
      {boton('Subir', <HiOutlineArrowUp className='h-3.5 w-3.5' />, () => acciones.desplazar(b.id, -1))}
      {boton('Bajar', <HiOutlineArrowDown className='h-3.5 w-3.5' />, () => acciones.desplazar(b.id, 1))}
      {boton('Duplicar', <HiOutlineDocumentDuplicate className='h-3.5 w-3.5' />, () => acciones.duplicar(b.id))}
      {acciones.guardarComponente ? boton('Guardar como componente', <HiOutlineBookmark className='h-3.5 w-3.5' />, () => acciones.guardarComponente!(b.id)) : null}
      {boton('Eliminar', <HiOutlineTrash className='h-3.5 w-3.5' />, () => acciones.eliminar(b.id), true)}
    </div>
  );
}

/** Contenido de un bloque simple, con los mismos estilos que el HTML generado. */
function ContenidoSimple({ b, a, acciones, activo }: { b: BloqueSimple; a: AjustesDiseno; acciones: Acciones; activo: boolean }) {
  const fuente: CSSProperties = { fontFamily: a.fuente };
  switch (b.tipo) {
    case 'encabezado':
      return (
        <TextoEnriquecido
          etiqueta='Título'
          enLinea
          html={b.html}
          activo={activo}
          variables={acciones.variables}
          onCrearVariable={acciones.onCrearVariable}
          onCommit={(html) => acciones.actualizar(b.id, { html })}
          estilo={{ ...fuente, fontSize: TAMANO_TITULO[b.nivel], lineHeight: 1.3, fontWeight: 700, color: b.color || a.colorTexto, textAlign: b.alineacion }}
        />
      );
    case 'texto':
      return (
        <TextoEnriquecido
          etiqueta='Texto'
          html={b.html}
          activo={activo}
          variables={acciones.variables}
          onCrearVariable={acciones.onCrearVariable}
          onCommit={(html) => acciones.actualizar(b.id, { html })}
          estilo={{ ...fuente, fontSize: b.tamano > 0 ? b.tamano : a.tamanoBase, lineHeight: b.interlineado, color: b.color || a.colorTexto, textAlign: b.alineacion }}
        />
      );
    case 'pie':
      return (
        <TextoEnriquecido
          etiqueta='Pie de página'
          html={b.html}
          activo={activo}
          variables={acciones.variables}
          onCrearVariable={acciones.onCrearVariable}
          onCommit={(html) => acciones.actualizar(b.id, { html })}
          estilo={{ ...fuente, fontSize: b.tamano, lineHeight: 1.6, color: b.color || '#64748b', textAlign: b.alineacion }}
        />
      );
    case 'imagen': {
      const src = urlSegura(b.url);
      const esVariable = /^\{\{/.test(src);
      return (
        <div style={{ textAlign: b.alineacion }}>
          {src && !esVariable ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={b.alt} style={{ display: 'inline-block', width: `${b.ancho}%`, height: 'auto', borderRadius: b.redondeo }} />
          ) : (
            <div className='mx-auto flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-10 text-xs text-slate-500' style={{ width: `${b.ancho}%` }}>
              <HiOutlinePhoto className='h-8 w-8' />
              {esVariable ? `Imagen dinámica ${src}` : 'Selecciona el bloque y pega la URL de la imagen'}
            </div>
          )}
        </div>
      );
    }
    case 'boton': {
      const estilo: CSSProperties = {
        ...fuente,
        display: b.anchoCompleto ? 'block' : 'inline-block',
        background: b.colorFondo,
        color: b.colorTexto,
        fontSize: b.tamano,
        fontWeight: 700,
        lineHeight: 1.2,
        borderRadius: b.redondeo,
        padding: `${Math.round(b.tamano * 0.75)}px ${Math.round(b.tamano * 1.5)}px`,
        textAlign: 'center',
      };
      return (
        <div style={{ textAlign: b.alineacion }}>
          <span style={estilo}>{b.texto || 'Botón'}</span>
        </div>
      );
    }
    case 'divisor':
      return <div style={{ borderTop: `${b.grosor}px ${b.linea} ${b.color}` }} />;
    case 'espaciador':
      return <div style={{ height: b.alto }} className={activo ? 'bg-primary/5' : ''} />;
    case 'redes':
      return (
        <div style={{ textAlign: b.alineacion }}>
          {b.redes.map((r, i) => {
            const info = REDES[r.red] ?? REDES.web;
            return (
              <span
                key={`${r.red}-${i}`}
                title={info.nombre}
                style={{
                  display: 'inline-block',
                  width: 32,
                  height: 32,
                  lineHeight: '32px',
                  borderRadius: 16,
                  margin: '0 4px',
                  background: b.variante === 'color' ? info.color : a.colorTexto,
                  color: '#fff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: 'center',
                }}>
                {info.letra}
              </span>
            );
          })}
          {!b.redes.length ? <span className='text-xs text-slate-400'>Agrega redes en el panel derecho</span> : null}
        </div>
      );
    case 'tabla':
      return (
        <table className='w-full border-separate overflow-hidden rounded-md' style={{ border: `1px solid ${b.colorBorde}`, borderSpacing: 0, fontFamily: a.fuente, fontSize: b.tamano }}>
          <tbody>
            {b.filas.map((f, i) => {
              const ultima = b.resaltarUltima && i === b.filas.length - 1;
              const fondo = ultima ? b.colorBorde : b.cebra && i % 2 === 1 ? '#f8fafc' : undefined;
              return (
                <tr key={i}>
                  <td style={{ background: fondo, padding: '10px 12px', borderBottom: `1px solid ${b.colorBorde}`, color: b.colorEtiqueta, width: '42%', fontWeight: ultima ? 700 : 400 }}>{f.etiqueta}</td>
                  <td style={{ background: fondo, padding: '10px 12px', borderBottom: `1px solid ${b.colorBorde}`, color: a.colorTexto, fontWeight: ultima ? 700 : 600, textAlign: 'right' }}>{f.valor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    case 'html':
      return (
        <div className='relative'>
          <HtmlAislado codigo={b.codigo} fuente={a.fuente} />
          <span className='absolute right-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 font-mono text-[10px] text-white'>HTML</span>
        </div>
      );
  }
}

function ListaBloques({ bloques, padre, a, acciones }: { bloques: Bloque[]; padre: Destino['padre']; a: AjustesDiseno; acciones: Acciones }) {
  if (!bloques.length) {
    return (
      <div className='p-2'>
        <ZonaSoltar
          vacia
          destino={{ padre, indice: 0 }}
          acciones={acciones}
          texto={padre ? 'Arrastra un bloque aquí' : 'Arrastra bloques desde el panel izquierdo o haz clic en uno para agregarlo'}
        />
      </div>
    );
  }
  return (
    <>
      <ZonaSoltar destino={{ padre, indice: 0 }} acciones={acciones} />
      {bloques.map((b, i) => (
        <div key={b.id}>
          <BloqueEnLienzo b={b} a={a} acciones={acciones} padre={padre} indice={i} />
          <ZonaSoltar destino={{ padre, indice: i + 1 }} acciones={acciones} />
        </div>
      ))}
    </>
  );
}

function BloqueEnLienzo({ b, a, acciones, padre, indice }: { b: Bloque; a: AjustesDiseno; acciones: Acciones; padre: Destino['padre']; indice: number }) {
  const activo = acciones.seleccionado === b.id;
  // Soltar sobre el bloque: mitad superior = antes, inferior = después
  const [lado, setLado] = useState<'antes' | 'despues' | null>(null);
  const puedeSoltar = acciones.arrastre !== null && !(padre && acciones.arrastre.tipo === 'columnas') && !(acciones.arrastre.clase === 'mover' && acciones.arrastre.id === b.id);
  const sobre = (e: DragEvent<HTMLDivElement>) => {
    if (!puedeSoltar) return;
    e.preventDefault();
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const nuevo = e.clientY - r.top < r.height / 2 ? 'antes' : 'despues';
    if (nuevo !== lado) setLado(nuevo);
  };
  const arrastrandoEste = acciones.arrastre?.clase === 'mover' && acciones.arrastre.id === b.id;
  const relleno: CSSProperties = { padding: `${b.estilo.rellenoV}px ${acciones.movil ? Math.min(b.estilo.rellenoH, 16) : b.estilo.rellenoH}px`, background: b.estilo.fondo || undefined };

  return (
    <div
      data-bloque={b.id}
      onDragOver={sobre}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setLado(null);
      }}
      onDrop={(e) => {
        if (!puedeSoltar) return;
        e.preventDefault();
        e.stopPropagation();
        const l = lado;
        setLado(null);
        acciones.soltar({ padre, indice: l === 'antes' ? indice : indice + 1 });
      }}
      onClick={(e) => {
        e.stopPropagation();
        acciones.seleccionar(b.id);
      }}
      className={`group/bloque relative outline-offset-[-2px] transition ${activo ? 'z-10 outline outline-2 outline-primary' : 'hover:outline hover:outline-1 hover:outline-primary/50'} ${arrastrandoEste ? 'opacity-40' : ''}`}>
      {activo ? <BarraBloque b={b} acciones={acciones} /> : null}
      {lado && puedeSoltar ? (
        <div
          aria-hidden='true'
          className={`pointer-events-none absolute inset-x-2 z-30 h-1 rounded-full bg-primary shadow-[0_0_0_3px_rgba(37,99,235,0.2)] ${lado === 'antes' ? '-top-0.5' : '-bottom-0.5'}`}
        />
      ) : null}
      <span
        draggable
        title='Arrastrar para mover'
        aria-label={`Arrastrar ${nombreTipo(b.tipo)}`}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData(MIME_MOVER, b.id);
          e.dataTransfer.effectAllowed = 'move';
          acciones.setArrastre({ clase: 'mover', id: b.id, tipo: b.tipo });
        }}
        onDragEnd={() => acciones.setArrastre(null)}
        className={`absolute -left-7 top-1/2 z-20 hidden -translate-y-1/2 cursor-grab rounded-md border border-border bg-background p-0.5 text-muted-foreground shadow-sm active:cursor-grabbing lg:block ${activo ? 'opacity-100' : 'opacity-0 group-hover/bloque:opacity-100'}`}>
        <MdDragIndicator className='h-5 w-5' />
      </span>
      <div style={relleno}>
        {b.tipo === 'columnas' ? (
          <div className={`flex ${acciones.movil ? 'flex-col' : 'flex-row'}`} style={{ gap: b.espacio, alignItems: b.vertical === 'middle' ? 'center' : 'flex-start' }}>
            {b.columnas.map((col, c) => (
              <div
                key={c}
                className='min-w-0 rounded-md outline-dashed outline-1 outline-transparent transition group-hover/bloque:outline-slate-300'
                style={{ flexBasis: acciones.movil ? '100%' : `${ANCHOS_DISTRIBUCION[b.distribucion]?.[c] ?? 50}%`, flexGrow: 0, flexShrink: 1 }}>
                <ListaBloques bloques={col} padre={{ id: b.id, col: c }} a={a} acciones={acciones} />
              </div>
            ))}
          </div>
        ) : (
          <ContenidoSimple b={b} a={a} acciones={acciones} activo={activo} />
        )}
      </div>
    </div>
  );
}

/** Lienzo WYSIWYG: el correo tal como se verá, con selección, barra de acciones y zonas para soltar bloques. */
export function Lienzo({ diseno, acciones }: { diseno: Diseno; acciones: Acciones }) {
  const a = diseno.ajustes;
  const ancho = acciones.movil ? 375 : a.ancho;
  return (
    <div
      className='min-h-full overflow-x-auto px-4 py-8 sm:px-10'
      style={{ background: a.fondoExterior }}
      onClick={() => acciones.seleccionar(null)}>
      {a.preheader ? (
        <p className='mx-auto mb-2 truncate text-center text-[11px] text-slate-500' style={{ maxWidth: ancho }}>
          Vista previa en la bandeja: <span className='italic'>{a.preheader}</span>
        </p>
      ) : null}
      <div
        className='mx-auto shadow-sm transition-[max-width] duration-300'
        style={{ maxWidth: ancho, width: '100%', background: a.fondoContenido, borderRadius: acciones.movil ? 0 : a.redondeo, fontFamily: a.fuente, color: a.colorTexto }}>
        <ListaBloques bloques={diseno.bloques} padre={null} a={a} acciones={acciones} />
      </div>
    </div>
  );
}

export type { Acciones as AccionesLienzo };
