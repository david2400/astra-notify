/** @format */

'use client';

import { useState } from 'react';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { previsualizarPlantillaServerAction } from '@/app/[locale]/(protected)/administre/sms/plantillas/actions';
import type { IPlantilla, IPlantillaPreview } from '../models/plantilla.interface';

/** Renderiza la plantilla en el gateway con valores de prueba: texto final, codificación y partes. */
export function PlantillaPreview({ plantilla }: { plantilla: IPlantilla }) {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(plantilla.variables.map((v) => [v.nombre, v.valor_defecto ?? ''])),
  );
  const [resultado, setResultado] = useState<IPlantillaPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const previsualizar = async () => {
    setCargando(true);
    setError(null);
    // Las vacías no se envían: así se prueban obligatorias y valores por defecto.
    const variables = Object.fromEntries(Object.entries(valores).filter(([, v]) => v.trim() !== ''));
    const r = await previsualizarPlantillaServerAction({ codigo: plantilla.codigo, variables });
    setCargando(false);
    if (r.success) setResultado(r.data);
    else {
      setResultado(null);
      setError(r.error);
    }
  };

  return (
    <div className='space-y-5'>
      <p className='rounded-lg bg-muted/40 p-3 font-mono text-xs text-muted-foreground'>{plantilla.contenido}</p>
      {plantilla.variables.length ? (
        <div className='grid gap-3 sm:grid-cols-2'>
          {plantilla.variables.map((v) => (
            <div key={v.nombre} className='space-y-1.5'>
              <label htmlFor={`prev-${v.nombre}`} className='text-sm font-medium text-foreground'>
                {v.nombre} <span className='text-xs text-muted-foreground'>({v.tipo_dato}{v.obligatoria ? ', obligatoria' : ''})</span>
              </label>
              <Input
                id={`prev-${v.nombre}`}
                value={valores[v.nombre] ?? ''}
                placeholder={v.descripcion ?? ''}
                onChange={(e) => setValores((prev) => ({ ...prev, [v.nombre]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      ) : null}
      <Buttons loading={cargando} onClick={previsualizar} className='w-full'>
        Previsualizar
      </Buttons>
      {error ? <p className='rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{error}</p> : null}
      {resultado ? (
        <div className='space-y-2 rounded-xl border border-border p-4'>
          <p className='whitespace-pre-wrap text-sm text-foreground'>{resultado.texto}</p>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='outline'>{resultado.codificacion}</Badge>
            <Badge variant='outline'>{resultado.longitud} caracteres</Badge>
            <Badge variant={resultado.partes > 1 ? 'secondary' : 'default'}>
              {resultado.partes} SMS
            </Badge>
          </div>
        </div>
      ) : null}
    </div>
  );
}
