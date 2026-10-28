/** @format */

/** No se pudo leer un catálogo o el historial de un gateway. */
export function ErrorCarga({ recurso, gateway, detalle }: { recurso: string; gateway: string; detalle?: string }) {
  return (
    <div role='alert' className='rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-8 text-center'>
      <p className='text-base font-semibold text-foreground'>No se pudieron cargar {recurso}</p>
      <p className='mx-auto mt-2 max-w-xl text-sm text-muted-foreground'>Verifica que {gateway} esté disponible.</p>
      {detalle ? <p className='mt-2 break-words text-xs text-muted-foreground'>Detalle: {detalle}</p> : null}
    </div>
  );
}
