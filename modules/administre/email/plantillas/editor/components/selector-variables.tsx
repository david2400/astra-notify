/** @format */

'use client';

import { useEffect, useRef, useState } from 'react';
import { HiOutlineCodeBracket, HiOutlinePlus } from 'react-icons/hi2';

const NOMBRE = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/;

/**
 * Botón "Personalizar" (como en Brevo): lista las variables de la plantilla y permite crear una nueva.
 * No roba el foco (mousedown preventDefault) para insertar en la posición del cursor del campo activo.
 */
export function SelectorVariables({
  variables,
  onSeleccionar,
  onCrear,
  compacto,
  etiqueta = 'Personalizar',
}: {
  variables: string[];
  onSeleccionar: (nombre: string) => void;
  /** Si se pasa, permite declarar una variable nueva desde el menú. */
  onCrear?: (nombre: string) => void;
  compacto?: boolean;
  etiqueta?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nueva, setNueva] = useState('');
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto]);

  const elegir = (nombre: string) => {
    onSeleccionar(nombre);
    setAbierto(false);
  };
  const crear = () => {
    const n = nueva.trim();
    if (!NOMBRE.test(n) || !onCrear) return;
    onCrear(n);
    elegir(n);
    setNueva('');
  };

  return (
    <div ref={raiz} className='relative shrink-0'>
      <button
        type='button'
        aria-haspopup='menu'
        aria-expanded={abierto}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setAbierto((v) => !v)}
        title='Insertar variable'
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${compacto ? 'px-2.5' : 'px-3'}`}>
        <HiOutlineCodeBracket className='h-4 w-4' />
        {compacto ? <span className='sr-only'>{etiqueta}</span> : etiqueta}
      </button>
      {abierto ? (
        <div role='menu' className='absolute right-0 z-50 mt-1 w-60 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg'>
          <p className='px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>Variables</p>
          <div className='max-h-56 overflow-y-auto'>
            {variables.length ? (
              variables.map((v) => (
                <button
                  key={v}
                  type='button'
                  role='menuitem'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(v)}
                  className='flex w-full items-center rounded-md px-2 py-1.5 text-left font-mono text-xs hover:bg-muted focus-visible:bg-muted focus-visible:outline-none'>
                  {`{{${v}}}`}
                </button>
              ))
            ) : (
              <p className='px-2 py-1.5 text-xs text-muted-foreground'>Aún no hay variables.</p>
            )}
          </div>
          {onCrear ? (
            <div className='mt-2 flex gap-1 border-t border-border pt-2'>
              <input
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    crear();
                  }
                }}
                placeholder='nueva_variable'
                aria-label='Nombre de la nueva variable'
                className='h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'
              />
              <button type='button' onClick={crear} disabled={!NOMBRE.test(nueva.trim())} aria-label='Crear e insertar' className='rounded-md border border-input px-2 hover:bg-muted disabled:opacity-40'>
                <HiOutlinePlus className='h-4 w-4' />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
