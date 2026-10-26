/** @format */

'use client';

/**
 * Muestra HTML de email en un iframe aislado (sandbox sin scripts ni navegación): el contenido no puede
 * ejecutar JavaScript ni leer la sesión de la aplicación.
 */
export function VistaHtml({ html, titulo = 'Vista previa del email', alto = 420 }: { html: string; titulo?: string; alto?: number }) {
  return (
    <iframe
      title={titulo}
      sandbox=''
      srcDoc={html || '<p style="font-family:sans-serif;color:#888">Sin contenido HTML</p>'}
      className='w-full rounded-xl border border-border bg-white'
      style={{ height: alto }}
    />
  );
}
