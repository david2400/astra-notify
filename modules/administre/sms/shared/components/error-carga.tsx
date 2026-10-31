/** @format */

/** Error al leer datos en el servidor: notificacion (configuración) o sms_gateway (plantillas). */
export function ErrorCarga({ recurso, detalle }: { recurso: string; detalle?: string }) {
  return (
    <div role='alert' className='rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-10 text-center'>
      <p className='text-base font-semibold text-foreground'>No se pudieron cargar {recurso}</p>
      <p className='mx-auto mt-2 max-w-xl text-sm text-muted-foreground'>
        Verifica que notificacion (NOTIFICACION_API_URL) esté arriba; las plantillas vienen de sms_gateway a través de notificacion.
      </p>
      {detalle ? <p className='mt-2 break-words text-xs text-muted-foreground'>Detalle: {detalle}</p> : null}
    </div>
  );
}
