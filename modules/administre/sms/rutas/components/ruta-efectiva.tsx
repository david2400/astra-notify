/** @format */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { obtenerRutaEfectivaServerAction } from '@/app/[locale]/(protected)/administre/sms/rutas/actions';
import { CENTRAL, type IRuta, type IRutaEfectiva } from '../models/ruta.interface';

/** Cómo usará el motor la ruta: pasos activos, credenciales y advertencias. */
export function RutaEfectiva({ ruta }: { ruta: IRuta }) {
  const [efectiva, setEfectiva] = useState<IRutaEfectiva | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerRutaEfectivaServerAction({
      proveedor: ruta.proveedor_codigo === CENTRAL ? undefined : ruta.proveedor_codigo,
      tipo_mensaje: ruta.tipo_mensaje,
    }).then((r) => {
      if (!vigente) return;
      if (r.success) setEfectiva(r.data);
      else setError(r.error);
    });
    return () => {
      vigente = false;
    };
  }, [ruta]);

  if (error) return <p className='text-sm text-destructive'>{error}</p>;
  if (!efectiva) return <p className='text-sm text-muted-foreground'>Consultando el motor...</p>;

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        {efectiva.configurada ? (
          <Badge variant='default'>Configurada</Badge>
        ) : (
          <Badge variant='destructive'>Sin ruta activa: respondería 422</Badge>
        )}
        <span className='text-sm text-muted-foreground'>
          {efectiva.proveedor} · {efectiva.tipo_mensaje}
        </span>
      </div>
      <ol className='space-y-2'>
        {efectiva.pasos.map((paso) => (
          <li key={paso.orden} className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm'>
            <span>
              <span className='font-semibold text-foreground'>
                {paso.orden}. {paso.cuenta}
              </span>{' '}
              <span className='text-muted-foreground'>
                ({paso.proveedor}) · {paso.max_intentos} intentos · {paso.espera_ms} ms
              </span>
            </span>
            <span className='flex gap-2'>
              {paso.credenciales_ok ? <Badge variant='secondary'>Credenciales OK</Badge> : <Badge variant='destructive'>Sin credenciales</Badge>}
              {paso.implementado ? null : <Badge variant='destructive'>Sin módulo</Badge>}
            </span>
          </li>
        ))}
      </ol>
      {efectiva.advertencias.length ? (
        <ul className='list-disc space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 p-3 pl-8 text-sm text-foreground'>
          {efectiva.advertencias.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
