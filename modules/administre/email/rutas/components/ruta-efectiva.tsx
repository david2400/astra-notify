/** @format */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { Buttons } from '@repo/ui/buttons/scenes';
import { obtenerRutaEfectivaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/rutas/actions';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import type { IRuta, IRutaEfectiva } from '../models/ruta.interface';

interface Props {
  ruta: IRuta;
  proveedores: OpcionSelect[];
  cuentas: OpcionSelect[];
}

/**
 * Simula el planner del motor: qué cuentas usaría un envío y en qué orden. Para la ruta CENTRAL permite
 * probar con proveedor preferido y cuenta específica (campos del request).
 */
export function RutaEfectiva({ ruta, proveedores, cuentas }: Props) {
  const central = !ruta.proveedor;
  const [preferido, setPreferido] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [efectiva, setEfectiva] = useState<IRutaEfectiva | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const r = await obtenerRutaEfectivaEmailServerAction({
      tipo_mensaje: ruta.tipo_mensaje,
      proveedor: ruta.proveedor ?? undefined,
      proveedor_preferido: central && preferido ? preferido : undefined,
      cuenta: cuenta || undefined,
    });
    setCargando(false);
    if (r.success) setEfectiva(r.data);
    else setError(r.error);
  }, [ruta, central, preferido, cuenta]);

  useEffect(() => {
    void consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta]);

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-12 items-end gap-3'>
        {central ? (
          <NativeSelect
            id='simular-preferido'
            label='Proveedor preferido'
            placeholder='Ninguno'
            opciones={proveedores}
            value={preferido}
            className='col-span-12 md:col-span-5'
            onChange={(e) => setPreferido(e.target.value)}
          />
        ) : null}
        <NativeSelect
          id='simular-cuenta'
          label='Cuenta específica'
          placeholder='Ninguna'
          opciones={cuentas}
          value={cuenta}
          className={central ? 'col-span-12 md:col-span-5' : 'col-span-12 md:col-span-10'}
          onChange={(e) => setCuenta(e.target.value)}
        />
        <Buttons className='col-span-12 md:col-span-2' loading={cargando} onClick={consultar}>
          Simular
        </Buttons>
      </div>

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      {!efectiva && !error ? <p className='text-sm text-muted-foreground'>Consultando el motor...</p> : null}
      {efectiva ? (
        <>
          <div className='flex flex-wrap items-center gap-2'>
            {efectiva.ok ? (
              <Badge variant='default'>Envío posible</Badge>
            ) : (
              <Badge variant='destructive'>422 {efectiva.codigo_error}</Badge>
            )}
            <span className='text-sm text-muted-foreground'>
              {efectiva.proveedor ?? 'CENTRAL'} · {efectiva.tipo_mensaje}
            </span>
          </div>
          {efectiva.detalle ? <p className='rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm'>{efectiva.detalle}</p> : null}
          <ol className='space-y-2'>
            {(efectiva.pasos ?? []).map((paso) => (
              <li key={paso.orden} className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm'>
                <span>
                  <span className='font-semibold text-foreground'>
                    {paso.orden}. {paso.cuenta}
                  </span>{' '}
                  <span className='text-muted-foreground'>
                    ({paso.proveedor}) · {paso.max_intentos} intentos · backoff desde {paso.espera_ms} ms
                  </span>
                </span>
                {paso.orden === 1 ? <Badge variant='secondary'>Principal</Badge> : <Badge variant='outline'>Respaldo</Badge>}
              </li>
            ))}
          </ol>
          <p className='text-xs text-muted-foreground'>
            Se omiten cuentas inactivas, de proveedores sin el servicio o sin implementación. Errores de cuenta (credenciales, cuota)
            pasan al siguiente paso de inmediato; errores temporales se reintentan con backoff.
          </p>
        </>
      ) : null}
    </div>
  );
}
