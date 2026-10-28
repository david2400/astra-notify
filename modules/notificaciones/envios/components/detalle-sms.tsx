/** @format */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { obtenerEnvioSmsServerAction } from '@/app/[locale]/(protected)/notificaciones/envios/actions';
import { EstadoEnvioBadge } from '@/modules/administre/email/shared';
import { fechaSms, type ISmsEnvio } from '../models/envio.interface';

/** Detalle de un SMS con la traza de intentos por paso de la ruta (fallback entre proveedores). */
export function DetalleSms({ envioId }: { envioId: string }) {
  const [envio, setEnvio] = useState<ISmsEnvio | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerEnvioSmsServerAction(envioId).then((r) => {
      if (!vigente) return;
      if (r.success) setEnvio(r.data);
      else setError(r.error);
    });
    return () => {
      vigente = false;
    };
  }, [envioId]);

  if (error) return <p className='text-sm text-destructive'>{error}</p>;
  if (!envio) return <p className='text-sm text-muted-foreground'>Cargando...</p>;

  return (
    <div className='space-y-4 text-sm'>
      <dl className='grid grid-cols-2 gap-3 md:grid-cols-3'>
        <div><dt className='text-xs text-muted-foreground'>Envío</dt><dd className='break-all font-mono text-xs'>{envio.envio_id}</dd></div>
        <div><dt className='text-xs text-muted-foreground'>Estado</dt><dd><EstadoEnvioBadge estado={envio.estado} /></dd></div>
        <div><dt className='text-xs text-muted-foreground'>Destino</dt><dd>{envio.destino}</dd></div>
        <div><dt className='text-xs text-muted-foreground'>Tipo / canal</dt><dd>{envio.tipo_mensaje}{envio.canal ? ` · ${envio.canal}` : ''}</dd></div>
        <div><dt className='text-xs text-muted-foreground'>Proveedor final</dt><dd>{envio.proveedor_final ? `${envio.proveedor_final} / ${envio.cuenta_final ?? '--'}` : '--'}</dd></div>
        <div><dt className='text-xs text-muted-foreground'>Intentos</dt><dd>{envio.total_intentos}</dd></div>
        <div><dt className='text-xs text-muted-foreground'>Creado</dt><dd>{fechaSms(envio.fecha_creacion)}</dd></div>
        <div><dt className='text-xs text-muted-foreground'>Finalizado</dt><dd>{fechaSms(envio.fecha_finalizacion)}</dd></div>
        <div><dt className='text-xs text-muted-foreground'>HTTP final</dt><dd>{envio.http_status_final ?? '--'}</dd></div>
      </dl>
      <div>
        <p className='mb-1 text-xs text-muted-foreground'>Mensaje</p>
        <p className='whitespace-pre-wrap rounded-lg bg-muted/40 p-3'>{envio.mensaje}</p>
      </div>
      {envio.codigo_error || envio.detalle_error ? (
        <p className='rounded-lg border border-destructive/40 bg-destructive/5 p-3'>
          {envio.codigo_error ? <span className='font-medium'>{envio.codigo_error}: </span> : null}
          {envio.detalle_error}
        </p>
      ) : null}
      {envio.intentos?.length ? (
        <div className='overflow-x-auto rounded-xl border border-border'>
          <table className='w-full text-xs'>
            <thead className='bg-muted/40 text-left uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-3 py-2'>Paso</th>
                <th className='px-3 py-2'>Intento</th>
                <th className='px-3 py-2'>Proveedor / cuenta</th>
                <th className='px-3 py-2'>Resultado</th>
                <th className='px-3 py-2'>HTTP</th>
                <th className='px-3 py-2'>Duración</th>
                <th className='px-3 py-2'>Detalle</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {envio.intentos.map((i, n) => (
                <tr key={n}>
                  <td className='px-3 py-2'>{i.paso_orden}</td>
                  <td className='px-3 py-2'>{i.nro_intento}</td>
                  <td className='px-3 py-2'>{i.proveedor ?? '--'} / {i.cuenta ?? '--'}</td>
                  <td className='px-3 py-2'>{i.exitoso ? <Badge variant='default'>Éxito</Badge> : <Badge variant='destructive'>Falló</Badge>}</td>
                  <td className='px-3 py-2'>{i.http_status ?? '--'}</td>
                  <td className='px-3 py-2'>{i.duracion_ms} ms</td>
                  <td className='max-w-xs px-3 py-2 text-muted-foreground'>{i.detalle ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
