/** @format */

/** Vista previa aislada del HTML (iframe sin scripts ni acceso al origen). */
export function VistaHtml({ html, asunto, alto = 360 }: { html: string; asunto?: string; alto?: number }) {
  return (
    <div className='overflow-hidden rounded-xl border border-border'>
      {asunto !== undefined ? (
        <div className='border-b border-border bg-muted/40 px-3 py-2 text-sm'>
          <span className='text-muted-foreground'>Asunto: </span>
          <span className='font-medium text-foreground'>{asunto || '(sin asunto)'}</span>
        </div>
      ) : null}
      <iframe title='Vista previa del correo' sandbox='' srcDoc={html} className='w-full bg-white' style={{ height: alto }} />
    </div>
  );
}
