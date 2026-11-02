/** @format */

'use client';

import { useEffect, useState } from 'react';
import { HiOutlineCodeBracketSquare, HiOutlineSparkles } from 'react-icons/hi2';
import { GALERIA, type PlantillaGaleria } from '../utils/galeria';
import { generarHtml } from '../utils/generar-html';

/** Miniatura del correo (iframe sin scripts escalado). */
function Miniatura({ html }: { html: string }) {
  return (
    <div className='relative h-56 overflow-hidden rounded-t-xl bg-slate-100'>
      <iframe
        title='Miniatura'
        sandbox=''
        srcDoc={html}
        tabIndex={-1}
        aria-hidden='true'
        className='pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white'
        style={{ width: 680, height: 900, transform: 'scale(0.42)' }}
      />
    </div>
  );
}

/**
 * Primer paso de una plantilla nueva (como la galería de Brevo): diseños de inicio editables o código HTML propio.
 */
export function GaleriaInicio({ onElegir, onHtml }: { onElegir: (p: PlantillaGaleria) => void; onHtml: () => void }) {
  // Las miniaturas se generan en el navegador (el generador usa DOMParser).
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({});
  useEffect(() => {
    setMiniaturas(Object.fromEntries(GALERIA.map((g) => [g.id, generarHtml(g.crear())])));
  }, []);

  return (
    <div className='space-y-5'>
      <div className='flex items-start gap-3'>
        <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
          <HiOutlineSparkles className='h-5 w-5' />
        </span>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>Elige cómo empezar</h2>
          <p className='text-sm text-muted-foreground'>Parte de un diseño y personalízalo con el editor de arrastrar y soltar, o pega tu propio HTML.</p>
        </div>
      </div>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {GALERIA.map((g) => (
          <button
            key={g.id}
            type='button'
            onClick={() => onElegir(g)}
            className='group overflow-hidden rounded-xl border border-border bg-background text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
            {miniaturas[g.id] ? <Miniatura html={miniaturas[g.id]!} /> : <div className='h-56 animate-pulse rounded-t-xl bg-muted' />}
            <div className='border-t border-border p-3'>
              <p className='font-semibold text-foreground group-hover:text-primary'>{g.nombre}</p>
              <p className='text-xs text-muted-foreground'>{g.descripcion}</p>
            </div>
          </button>
        ))}
        <button
          type='button'
          onClick={onHtml}
          className='group flex flex-col overflow-hidden rounded-xl border border-dashed border-border bg-background text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
          <div className='flex h-56 items-center justify-center bg-slate-900 text-slate-300'>
            <HiOutlineCodeBracketSquare className='h-16 w-16' />
          </div>
          <div className='border-t border-border p-3'>
            <p className='font-semibold text-foreground group-hover:text-primary'>Código HTML</p>
            <p className='text-xs text-muted-foreground'>Pega o escribe el HTML del correo.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
