/** @format */

/**
 * Esqueleto de carga para las pantallas de listado.
 *
 * Se usa desde los `loading.tsx` de cada sección. Antes no existía ninguno:
 * al navegar, el router se quedaba en la pantalla anterior sin ninguna señal
 * de que algo estuviera cargando.
 */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      role='status'
      aria-live='polite'
      aria-busy='true'
      className='w-full animate-pulse space-y-6'>
      <span className='sr-only'>Cargando información…</span>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-2'>
          <div className='h-5 w-56 rounded-md bg-muted' />
          <div className='h-4 w-80 max-w-full rounded-md bg-muted' />
        </div>
        <div className='h-10 w-36 rounded-xl bg-muted' />
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className='h-24 rounded-2xl border border-border bg-muted/50'
          />
        ))}
      </div>

      <div className='overflow-hidden rounded-lg border border-border'>
        <div className='h-11 bg-muted' />
        <div className='divide-y divide-border'>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className='flex items-center gap-4 px-4 py-3'>
              <div className='h-4 w-1/4 rounded bg-muted' />
              <div className='h-4 w-1/3 rounded bg-muted' />
              <div className='h-4 w-1/6 rounded bg-muted' />
              <div className='ml-auto h-8 w-20 rounded-lg bg-muted' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
