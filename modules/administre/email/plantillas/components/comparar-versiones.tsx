/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { versionPlantillaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/plantillas/actions';
import type { IPlantillaVersion } from '../models/plantilla.interface';
import { conContexto, diffLineas, lineasHtml, lineasTexto } from '../utils/diff';
import { VistaHtml } from './vista-html';
import { AprobacionBadge } from './aprobacion-badge';

type Vista = 'visual' | 'html' | 'texto' | 'datos';

const claseSelect = 'h-9 rounded-lg border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Cache por versión (el contenido de una versión no cambia nunca). */
function useVersion(codigo: string, version: number | null) {
  const [cache, setCache] = useState<Record<number, IPlantillaVersion | string>>({});
  useEffect(() => {
    if (version == null || cache[version] !== undefined) return;
    let vivo = true;
    void versionPlantillaEmailServerAction(codigo, version).then((r) => {
      if (vivo) setCache((c) => ({ ...c, [version]: r.success ? r.data : r.error || 'No se pudo cargar la versión' }));
    });
    return () => {
      vivo = false;
    };
  }, [codigo, version, cache]);
  return version == null ? undefined : cache[version];
}

function Diff({ a, b }: { a: string[]; b: string[] }) {
  const lineas = useMemo(() => diffLineas(a, b), [a, b]);
  if (!lineas) return <p className='text-sm text-muted-foreground'>El contenido es demasiado grande para compararlo línea a línea.</p>;
  const cambios = lineas.filter((l) => l.tipo !== 'igual');
  if (!cambios.length) return <p className='text-sm text-muted-foreground'>Sin diferencias.</p>;
  const agregadas = cambios.filter((l) => l.tipo === 'agregada').length;
  return (
    <div className='space-y-2'>
      <p className='text-xs text-muted-foreground'>
        <span className='font-semibold text-emerald-700 dark:text-emerald-400'>+{agregadas}</span> ·{' '}
        <span className='font-semibold text-destructive'>−{cambios.length - agregadas}</span> líneas
      </p>
      <div className='max-h-[520px] overflow-auto rounded-xl border border-border bg-background font-mono text-[12px] leading-5'>
        {conContexto(lineas).map((l, i) =>
          l.tipo === 'salto' ? (
            <div key={i} className='border-y border-border bg-muted/50 px-3 py-0.5 text-[11px] text-muted-foreground'>
              ⋯ {l.ocultas} líneas sin cambios
            </div>
          ) : (
            <div
              key={i}
              className={`grid grid-cols-[3rem_3rem_1rem_minmax(0,1fr)] ${l.tipo === 'agregada' ? 'bg-emerald-500/10' : l.tipo === 'eliminada' ? 'bg-destructive/10' : ''}`}>
              <span className='select-none pr-2 text-right text-muted-foreground/70'>{l.a ?? ''}</span>
              <span className='select-none pr-2 text-right text-muted-foreground/70'>{l.b ?? ''}</span>
              <span className={`select-none ${l.tipo === 'agregada' ? 'text-emerald-700' : l.tipo === 'eliminada' ? 'text-destructive' : ''}`}>
                {l.tipo === 'agregada' ? '+' : l.tipo === 'eliminada' ? '−' : ''}
              </span>
              <span className='whitespace-pre-wrap break-all pr-3'>{l.texto}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function DiffDatos({ a, b }: { a: IPlantillaVersion; b: IPlantillaVersion }) {
  const filas: { campo: string; antes: string; despues: string }[] = [];
  if (a.asunto !== b.asunto) filas.push({ campo: 'Asunto', antes: a.asunto, despues: b.asunto });
  if ((a.tipo_mensaje ?? '') !== (b.tipo_mensaje ?? '')) filas.push({ campo: 'Tipo de mensaje', antes: a.tipo_mensaje ?? '—', despues: b.tipo_mensaje ?? '—' });
  const desc = (v: IPlantillaVersion['variables'], nombre: string) => {
    const x = v?.find((y) => y.nombre === nombre);
    return x ? `${x.tipo_dato ?? 'TEXTO'} · ${x.obligatoria === false ? 'opcional' : 'obligatoria'}${x.valor_defecto ? ` · defecto "${x.valor_defecto}"` : ''}` : '—';
  };
  const nombres = [...new Set([...(a.variables ?? []), ...(b.variables ?? [])].map((v) => v.nombre))];
  nombres.forEach((n) => {
    const antes = desc(a.variables, n);
    const despues = desc(b.variables, n);
    if (antes !== despues) filas.push({ campo: `Variable {{${n}}}`, antes, despues });
  });
  if (!filas.length) return <p className='text-sm text-muted-foreground'>Asunto, tipo y variables iguales.</p>;
  return (
    <div className='overflow-x-auto rounded-xl border border-border'>
      <table className='w-full text-sm'>
        <thead className='bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground'>
          <tr>
            <th className='px-3 py-2'>Campo</th>
            <th className='px-3 py-2'>v{a.version}</th>
            <th className='px-3 py-2'>v{b.version}</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.campo} className='border-t border-border align-top'>
              <td className='px-3 py-2 font-medium'>{f.campo}</td>
              <td className='bg-destructive/5 px-3 py-2 font-mono text-xs'>{f.antes}</td>
              <td className='bg-emerald-500/5 px-3 py-2 font-mono text-xs'>{f.despues}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Compara dos versiones: vista lado a lado, diferencias de HTML, de texto plano y de asunto/variables. */
export function CompararVersiones({ codigo, versiones, inicialA, inicialB }: { codigo: string; versiones: IPlantillaVersion[]; inicialA: number; inicialB: number }) {
  const [va, setVa] = useState(inicialA);
  const [vb, setVb] = useState(inicialB);
  const [vista, setVista] = useState<Vista>('visual');
  useEffect(() => {
    setVa(inicialA);
    setVb(inicialB);
  }, [inicialA, inicialB]);
  const a = useVersion(codigo, va);
  const b = useVersion(codigo, vb);
  const listas = typeof a === 'object' && typeof b === 'object' ? { a, b } : null;
  const error = typeof a === 'string' ? a : typeof b === 'string' ? b : null;

  const selector = (valor: number, set: (v: number) => void, etiqueta: string) => (
    <label className='flex items-center gap-2 text-sm'>
      <span className='text-muted-foreground'>{etiqueta}</span>
      <select className={claseSelect} value={valor} onChange={(e) => set(Number(e.target.value))}>
        {versiones.map((v) => (
          <option key={v.version} value={v.version}>
            v{v.version} · {v.estado.toLowerCase().replace('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        {selector(va, setVa, 'Antes')}
        <span className='text-muted-foreground'>→</span>
        {selector(vb, setVb, 'Después')}
        <div className='ml-auto flex rounded-lg border border-border p-0.5 text-sm' role='tablist'>
          {(
            [
              ['visual', 'Visual'],
              ['html', 'HTML'],
              ['texto', 'Texto plano'],
              ['datos', 'Asunto y variables'],
            ] as const
          ).map(([id, t]) => (
            <button
              key={id}
              type='button'
              role='tab'
              aria-selected={vista === id}
              onClick={() => setVista(id)}
              className={`rounded-md px-3 py-1 ${vista === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      {!listas && !error ? <p className='text-sm text-muted-foreground'>Cargando versiones…</p> : null}
      {listas ? (
        va === vb ? (
          <p className='text-sm text-muted-foreground'>Elige dos versiones distintas.</p>
        ) : vista === 'visual' ? (
          <div className='grid gap-4 lg:grid-cols-2'>
            {[listas.a, listas.b].map((v) => (
              <div key={v.version} className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <strong className='text-sm'>v{v.version}</strong>
                  <AprobacionBadge estado={v.estado} />
                </div>
                <p className='truncate rounded-lg bg-muted/50 px-3 py-1.5 text-sm' title={v.asunto}>
                  {v.asunto}
                </p>
                <VistaHtml html={v.cuerpo_html ?? ''} alto={520} titulo={`Versión ${v.version}`} />
              </div>
            ))}
          </div>
        ) : vista === 'html' ? (
          <Diff a={lineasHtml(listas.a.cuerpo_html)} b={lineasHtml(listas.b.cuerpo_html)} />
        ) : vista === 'texto' ? (
          <Diff a={lineasTexto(listas.a.cuerpo_texto)} b={lineasTexto(listas.b.cuerpo_texto)} />
        ) : (
          <DiffDatos a={listas.a} b={listas.b} />
        )
      ) : null}
    </div>
  );
}
