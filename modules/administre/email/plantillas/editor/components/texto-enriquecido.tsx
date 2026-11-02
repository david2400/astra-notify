/** @format */

'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { HiOutlineLink, HiOutlineListBullet, HiOutlineNumberedList } from 'react-icons/hi2';
import { MdFormatClear, MdFormatColorText, MdLinkOff } from 'react-icons/md';
import { sanitizarHtmlTexto } from '../utils/sanitizar';
import { SelectorVariables } from './selector-variables';

interface Props {
  html: string;
  /** Recibe el HTML ya limpio cuando el usuario sale del bloque. */
  onCommit: (html: string) => void;
  activo: boolean;
  estilo: CSSProperties;
  variables: string[];
  onCrearVariable?: (nombre: string) => void;
  /** Solo formato en línea (títulos): sin listas. */
  enLinea?: boolean;
  etiqueta: string;
}

/** Botón de la barra de formato: no roba el foco del texto. */
function Herramienta({ titulo, onClick, children, activo }: { titulo: string; onClick: () => void; children: ReactNode; activo?: boolean }) {
  return (
    <button
      type='button'
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activo ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
      {children}
    </button>
  );
}

/**
 * Texto editable en el lienzo (contentEditable) con barra de formato flotante: negrita, cursiva, subrayado,
 * tachado, enlace, listas, color y "Personalizar" para insertar {{variables}} donde está el cursor.
 */
export function TextoEnriquecido({ html, onCommit, activo, estilo, variables, onCrearVariable, enLinea, etiqueta }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const rango = useRef<Range | null>(null);
  const ultimo = useRef(html);
  const [enlace, setEnlace] = useState<string | null>(null);
  const [formato, setFormato] = useState({ b: false, i: false, u: false });

  // El contenido se escribe a mano (no por React) para no mover el cursor mientras se edita.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.innerHTML !== html) el.innerHTML = html;
    ultimo.current = html;
  }, [html]);

  const confirmar = () => {
    const el = ref.current;
    if (!el) return;
    const limpio = sanitizarHtmlTexto(el.innerHTML);
    if (limpio !== ultimo.current) {
      ultimo.current = limpio;
      onCommit(limpio);
    }
  };

  // Al activarse se enfoca con el cursor al final; al desactivarse (otro bloque) se guarda lo escrito.
  useEffect(() => {
    const el = ref.current;
    if (activo && el && document.activeElement !== el) {
      el.focus();
      const sel = window.getSelection();
      if (sel) {
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
    if (!activo) {
      confirmar();
      setEnlace(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);

  useEffect(() => {
    if (!activo) return;
    const guardar = () => {
      const sel = window.getSelection();
      const el = ref.current;
      if (sel && sel.rangeCount > 0 && el && el.contains(sel.anchorNode)) {
        rango.current = sel.getRangeAt(0).cloneRange();
        setFormato({ b: document.queryCommandState('bold'), i: document.queryCommandState('italic'), u: document.queryCommandState('underline') });
      }
    };
    document.addEventListener('selectionchange', guardar);
    return () => document.removeEventListener('selectionchange', guardar);
  }, [activo]);

  const restaurar = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (rango.current && sel) {
      sel.removeAllRanges();
      sel.addRange(rango.current);
    }
  };

  const comando = (cmd: string, valor?: string) => {
    restaurar();
    document.execCommand(cmd, false, valor);
    confirmar();
  };

  const insertarVariable = (nombre: string) => {
    restaurar();
    document.execCommand('insertText', false, `{{${nombre}}}`);
    confirmar();
  };

  const aplicarEnlace = () => {
    const url = (enlace ?? '').trim();
    setEnlace(null);
    if (!url) return;
    comando('createLink', url);
  };

  return (
    <div className='relative'>
      {activo ? (
        <div
          role='toolbar'
          aria-label={`Formato de ${etiqueta}`}
          className='absolute left-0 top-full z-30 mt-2 flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg'
          onClick={(e) => e.stopPropagation()}>
          {enlace !== null ? (
            <div className='flex items-center gap-1 px-1'>
              <input
                autoFocus
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    aplicarEnlace();
                  }
                  if (e.key === 'Escape') setEnlace(null);
                }}
                placeholder='https://… o {{variable}}'
                aria-label='URL del enlace'
                className='h-8 w-56 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'
              />
              <button type='button' onClick={aplicarEnlace} className='h-8 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground'>
                Aplicar
              </button>
              <button type='button' onClick={() => setEnlace(null)} className='h-8 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted'>
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <Herramienta titulo='Negrita' activo={formato.b} onClick={() => comando('bold')}>
                <span className='font-bold'>B</span>
              </Herramienta>
              <Herramienta titulo='Cursiva' activo={formato.i} onClick={() => comando('italic')}>
                <span className='font-serif italic'>I</span>
              </Herramienta>
              <Herramienta titulo='Subrayado' activo={formato.u} onClick={() => comando('underline')}>
                <span className='underline'>U</span>
              </Herramienta>
              <Herramienta titulo='Tachado' onClick={() => comando('strikeThrough')}>
                <span className='line-through'>S</span>
              </Herramienta>
              <span className='mx-0.5 h-5 w-px bg-border' aria-hidden='true' />
              <Herramienta titulo='Insertar enlace' onClick={() => setEnlace('https://')}>
                <HiOutlineLink className='h-4 w-4' />
              </Herramienta>
              <Herramienta titulo='Quitar enlace' onClick={() => comando('unlink')}>
                <MdLinkOff className='h-4 w-4' />
              </Herramienta>
              {!enLinea ? (
                <>
                  <Herramienta titulo='Lista con viñetas' onClick={() => comando('insertUnorderedList')}>
                    <HiOutlineListBullet className='h-4 w-4' />
                  </Herramienta>
                  <Herramienta titulo='Lista numerada' onClick={() => comando('insertOrderedList')}>
                    <HiOutlineNumberedList className='h-4 w-4' />
                  </Herramienta>
                </>
              ) : null}
              <label title='Color del texto' className='relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted' onMouseDown={() => restaurar()}>
                <MdFormatColorText className='h-4 w-4' />
                <input
                  type='color'
                  aria-label='Color del texto seleccionado'
                  className='absolute inset-0 cursor-pointer opacity-0'
                  onChange={(e) => comando('foreColor', e.target.value)}
                />
              </label>
              <Herramienta titulo='Quitar formato' onClick={() => comando('removeFormat')}>
                <MdFormatClear className='h-4 w-4' />
              </Herramienta>
              <span className='mx-0.5 h-5 w-px bg-border' aria-hidden='true' />
              <SelectorVariables variables={variables} onSeleccionar={insertarVariable} onCrear={onCrearVariable} />
            </>
          )}
        </div>
      ) : null}
      <div
        ref={ref}
        role='textbox'
        aria-multiline={!enLinea}
        aria-label={etiqueta}
        contentEditable={activo}
        suppressContentEditableWarning
        spellCheck
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (enLinea && e.key === 'Enter') e.preventDefault();
        }}
        onPaste={(e) => {
          // Pegar como texto plano: evita estilos y HTML de otras páginas
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
        className={`min-h-[1.5em] break-words outline-none ${activo ? 'cursor-text' : 'cursor-pointer'} [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6`}
        style={estilo}
      />
    </div>
  );
}
