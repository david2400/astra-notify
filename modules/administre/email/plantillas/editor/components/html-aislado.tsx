/** @format */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Muestra HTML escrito por el usuario dentro de un iframe sin scripts (sandbox sin allow-scripts): ni <script> ni
 * atributos on* se ejecutan en la sesión de la aplicación. Ajusta su alto al contenido.
 */
export function HtmlAislado({ codigo, fuente, minimo = 24 }: { codigo: string; fuente?: string; minimo?: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [alto, setAlto] = useState(minimo);

  const medir = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (doc?.body) setAlto(Math.max(minimo, Math.ceil(doc.documentElement.scrollHeight)));
  }, [minimo]);

  useEffect(() => {
    const t = window.setTimeout(medir, 50);
    return () => window.clearTimeout(t);
  }, [codigo, medir]);

  return (
    <iframe
      ref={ref}
      title='Bloque HTML'
      sandbox='allow-same-origin'
      onLoad={medir}
      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;font-family:${fuente ?? 'Arial,sans-serif'}}img{max-width:100%}</style></head><body>${codigo}</body></html>`}
      className='pointer-events-none block w-full border-0'
      style={{ height: alto }}
    />
  );
}
