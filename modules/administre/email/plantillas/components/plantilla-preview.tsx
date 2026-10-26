/** @format */

'use client';

import { useEffect, useState } from 'react';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { obtenerPlantillaEmailServerAction, previsualizarPlantillaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/plantillas/actions';
import type { ICrearPlantilla, IPlantillaPreview } from '../models/plantilla.interface';

interface VariablePreview {
  nombre: string;
  tipo_dato?: string;
  obligatoria?: boolean;
  valor_defecto?: string | null;
  descripcion?: string | null;
}
import { VistaHtml } from './vista-html';

interface Props {
  /** Plantilla guardada (se lee el detalle completo) o... */
  codigo?: string;
  /** ...definición sin guardar (desde el editor). */
  borrador?: ICrearPlantilla;
}

/** Renderiza la plantilla en el gateway con valores de prueba: asunto, HTML (aislado) y texto. */
export function PlantillaEmailPreview({ codigo, borrador }: Props) {
  const [plantilla, setPlantilla] = useState<{ variables?: VariablePreview[] } | null>(borrador ? borrador : null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<IPlantillaPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (borrador || !codigo) return;
    let vigente = true;
    obtenerPlantillaEmailServerAction(codigo).then((r) => {
      if (!vigente) return;
      if (r.success) setPlantilla(r.data);
      else setError(r.error);
    });
    return () => {
      vigente = false;
    };
  }, [codigo, borrador]);

  useEffect(() => {
    if (plantilla) setValores(Object.fromEntries((plantilla.variables ?? []).map((v) => [v.nombre, v.valor_defecto ?? ''])));
  }, [plantilla]);

  const previsualizar = async () => {
    setCargando(true);
    setError(null);
    // Las vacías no se envían: así se prueban obligatorias y valores por defecto.
    const variables = Object.fromEntries(Object.entries(valores).filter(([, v]) => v.trim() !== ''));
    const r = await previsualizarPlantillaEmailServerAction({ codigo: borrador?.codigo || codigo || 'BORRADOR', variables, borrador });
    setCargando(false);
    if (r.success) setResultado(r.data);
    else {
      setResultado(null);
      setError(r.error);
    }
  };

  if (!plantilla && !error) return <p className='text-sm text-muted-foreground'>Cargando plantilla...</p>;

  return (
    <div className='space-y-5'>
      {plantilla?.variables?.length ? (
        <div className='grid gap-3 sm:grid-cols-2'>
          {plantilla.variables.map((v) => (
            <div key={v.nombre} className='space-y-1.5'>
              <label htmlFor={`prev-${v.nombre}`} className='text-sm font-medium text-foreground'>
                {v.nombre}{' '}
                <span className='text-xs text-muted-foreground'>
                  ({v.tipo_dato ?? 'TEXTO'}{v.obligatoria === false ? '' : ', obligatoria'})
                </span>
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
      ) : (
        <p className='text-sm text-muted-foreground'>La plantilla no tiene variables.</p>
      )}
      <Buttons loading={cargando} onClick={previsualizar} className='w-full'>
        Previsualizar en el gateway
      </Buttons>
      {error ? <p className='rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{error}</p> : null}
      {resultado ? (
        <div className='space-y-3'>
          <div className='flex flex-wrap gap-2'>
            {resultado.valido ? <Badge variant='default'>Válida</Badge> : <Badge variant='destructive'>Con errores</Badge>}
            {resultado.variables_sin_usar?.length ? (
              <Badge variant='secondary'>Sin usar: {resultado.variables_sin_usar.join(', ')}</Badge>
            ) : null}
          </div>
          {resultado.errores?.length ? (
            <ul className='list-disc space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 p-3 pl-8 text-sm'>
              {resultado.errores.map((e, i) => (
                <li key={i}>
                  {e.variable ? <strong>{e.variable}: </strong> : null}
                  {e.mensaje}
                </li>
              ))}
            </ul>
          ) : null}
          {resultado.asunto ? (
            <div className='rounded-lg border border-border p-3'>
              <p className='text-xs uppercase tracking-wider text-muted-foreground'>Asunto</p>
              <p className='text-sm font-semibold text-foreground'>{resultado.asunto}</p>
            </div>
          ) : null}
          {resultado.html ? <VistaHtml html={resultado.html} /> : null}
          {resultado.texto ? (
            <div className='rounded-lg border border-border p-3'>
              <p className='text-xs uppercase tracking-wider text-muted-foreground'>Texto plano</p>
              <p className='whitespace-pre-wrap text-sm text-foreground'>{resultado.texto}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
