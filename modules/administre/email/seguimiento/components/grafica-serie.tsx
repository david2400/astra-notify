/** @format */

'use client';

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { IPuntoSerie } from '@/server/domains/administre/email/envios/types';

/**
 * Serie diaria de envíos (SVG, sin dependencias). Paleta categórica validada (slots 1–4, claro/oscuro), líneas de
 * 2px, cruz que sigue al puntero con un tooltip de todas las series, etiquetas directas al final de cada línea,
 * leyenda y vista de tabla. Teclado: flechas para recorrer los días.
 */

const SERIES = [
  { clave: 'enviados', nombre: 'Enviados', clase: 'stroke-[#2a78d6] dark:stroke-[#3987e5]', relleno: 'bg-[#2a78d6] dark:bg-[#3987e5]' },
  { clave: 'entregados', nombre: 'Entregados', clase: 'stroke-[#eb6834] dark:stroke-[#d95926]', relleno: 'bg-[#eb6834] dark:bg-[#d95926]' },
  { clave: 'abiertos', nombre: 'Abiertos', clase: 'stroke-[#1baf7a] dark:stroke-[#199e70]', relleno: 'bg-[#1baf7a] dark:bg-[#199e70]' },
  { clave: 'clics', nombre: 'Clics', clase: 'stroke-[#eda100] dark:stroke-[#c98500]', relleno: 'bg-[#eda100] dark:bg-[#c98500]' },
] as const;

type Clave = (typeof SERIES)[number]['clave'];

const ANCHO = 720;
const ALTO = 260;
const M = { arriba: 16, derecha: 92, abajo: 28, izquierda: 40 };

/** Días entre desde y hasta (incluye los días sin envíos con 0). */
function completarDias(serie: IPuntoSerie[], desde: string, hasta: string, tzOffset: number): IPuntoSerie[] {
  const porFecha = new Map(serie.map((p) => [p.fecha, p]));
  const dia = (iso: string) => new Date(new Date(iso).getTime() + tzOffset * 60000).toISOString().slice(0, 10);
  const inicio = new Date(`${dia(desde)}T00:00:00Z`);
  const fin = new Date(`${dia(hasta)}T00:00:00Z`);
  const salida: IPuntoSerie[] = [];
  for (let d = inicio; d <= fin && salida.length < 400; d = new Date(d.getTime() + 86400000)) {
    const f = d.toISOString().slice(0, 10);
    salida.push(porFecha.get(f) ?? { fecha: f, total: 0, enviados: 0, entregados: 0, abiertos: 0, clics: 0, rebotes: 0, fallidos: 0 });
  }
  return salida;
}

const fechaCorta = (f: string) => new Date(`${f}T12:00:00Z`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmt = (n: number) => n.toLocaleString('es-CO');

/** Escala "bonita" para el eje Y (0, paso, ..., max). */
function marcasY(max: number): number[] {
  if (max <= 0) return [0, 1];
  const paso0 = max / 4;
  const pot = 10 ** Math.floor(Math.log10(paso0));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= paso0) ?? paso0;
  const tope = Math.ceil(max / paso) * paso;
  const marcas: number[] = [];
  for (let v = 0; v <= tope + 1e-9; v += paso) marcas.push(Math.round(v * 100) / 100);
  return marcas;
}

export function GraficaSerie({ serie, desde, hasta, tzOffset }: { serie: IPuntoSerie[]; desde: string; hasta: string; tzOffset: number }) {
  const datos = useMemo(() => completarDias(serie, desde, hasta, tzOffset), [serie, desde, hasta, tzOffset]);
  const [activo, setActivo] = useState<number | null>(null);
  const [tabla, setTabla] = useState(false);
  const svg = useRef<SVGSVGElement>(null);

  const max = Math.max(1, ...datos.map((d) => d.enviados));
  const ticks = marcasY(max);
  const tope = ticks[ticks.length - 1]!;
  const ancho = ANCHO - M.izquierda - M.derecha;
  const alto = ALTO - M.arriba - M.abajo;
  const x = (i: number) => M.izquierda + (datos.length <= 1 ? ancho / 2 : (i * ancho) / (datos.length - 1));
  const y = (v: number) => M.arriba + alto - (v / tope) * alto;
  const camino = (k: Clave) => datos.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(' ');
  const cadaEtiqueta = Math.max(1, Math.ceil(datos.length / 7));

  // Etiquetas directas al final: se separan si quedan encimadas.
  const ultimo = datos[datos.length - 1];
  const etiquetas = useMemo(() => {
    if (!ultimo) return [];
    const base = SERIES.map((s) => ({ ...s, valor: ultimo[s.clave], y: y(ultimo[s.clave]) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < base.length; i++) if (base[i]!.y - base[i - 1]!.y < 14) base[i]!.y = base[i - 1]!.y + 14;
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimo, tope]);

  const mover = (e: PointerEvent<SVGRectElement>) => {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect || !datos.length) return;
    const px = ((e.clientX - rect.left) / rect.width) * ANCHO;
    const i = datos.length <= 1 ? 0 : Math.round(((px - M.izquierda) / ancho) * (datos.length - 1));
    setActivo(Math.max(0, Math.min(datos.length - 1, i)));
  };
  const teclado = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActivo((a) => Math.max(0, Math.min(datos.length - 1, (a ?? datos.length - 1) + (e.key === 'ArrowRight' ? 1 : -1))));
    }
  };

  const punto = activo !== null ? datos[activo] : null;
  const izquierdaTooltip = activo !== null ? (x(activo) / ANCHO) * 100 : 0;

  return (
    <figure className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <ul className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground' aria-label='Leyenda'>
          {SERIES.map((s) => (
            <li key={s.clave} className='inline-flex items-center gap-1.5'>
              <span className={`h-0.5 w-4 rounded-full ${s.relleno}`} aria-hidden='true' />
              {s.nombre}
            </li>
          ))}
        </ul>
        <button type='button' onClick={() => setTabla((t) => !t)} className='text-xs font-medium text-primary hover:underline' aria-pressed={tabla}>
          {tabla ? 'Ver gráfica' : 'Ver como tabla'}
        </button>
      </div>

      {tabla ? (
        <div className='max-h-80 overflow-auto rounded-xl border border-border'>
          <table className='w-full text-sm'>
            <thead className='sticky top-0 bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-3 py-2'>Día</th>
                {SERIES.map((s) => (
                  <th key={s.clave} className='px-3 py-2 text-right'>
                    {s.nombre}
                  </th>
                ))}
                <th className='px-3 py-2 text-right'>Rebotes</th>
                <th className='px-3 py-2 text-right'>Fallidos</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {datos.map((d) => (
                <tr key={d.fecha}>
                  <td className='px-3 py-1.5'>{fechaCorta(d.fecha)}</td>
                  {SERIES.map((s) => (
                    <td key={s.clave} className='px-3 py-1.5 text-right tabular-nums'>
                      {fmt(d[s.clave])}
                    </td>
                  ))}
                  <td className='px-3 py-1.5 text-right tabular-nums'>{fmt(d.rebotes)}</td>
                  <td className='px-3 py-1.5 text-right tabular-nums'>{fmt(d.fallidos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='relative'>
          <svg
            ref={svg}
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            className='h-auto w-full touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            role='img'
            aria-label={`Envíos por día del ${fechaCorta(datos[0]?.fecha ?? '')} al ${fechaCorta(ultimo?.fecha ?? '')}. Usa las flechas para recorrer los días.`}
            tabIndex={0}
            onKeyDown={teclado}
            onBlur={() => setActivo(null)}>
            {/* Cuadrícula y eje Y */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(t)} y2={y(t)} className='stroke-border' strokeWidth={1} />
                <text x={M.izquierda - 8} y={y(t)} dy='0.32em' textAnchor='end' className='fill-muted-foreground text-[11px] tabular-nums'>
                  {fmt(t)}
                </text>
              </g>
            ))}
            {/* Eje X */}
            {datos.map((d, i) =>
              i % cadaEtiqueta === 0 || i === datos.length - 1 ? (
                <text key={d.fecha} x={x(i)} y={ALTO - 8} textAnchor='middle' className='fill-muted-foreground text-[11px]'>
                  {fechaCorta(d.fecha)}
                </text>
              ) : null,
            )}
            {/* Líneas */}
            {SERIES.map((s) => (
              <path key={s.clave} d={camino(s.clave)} fill='none' strokeWidth={2} strokeLinejoin='round' strokeLinecap='round' className={s.clase} />
            ))}
            {/* Etiquetas directas al final */}
            {etiquetas.map((s) => (
              <g key={s.clave}>
                <line x1={x(datos.length - 1) + 4} x2={x(datos.length - 1) + 12} y1={s.y} y2={s.y} strokeWidth={2} className={s.clase} />
                <text x={x(datos.length - 1) + 16} y={s.y} dy='0.32em' className='fill-foreground text-[11px]'>
                  <tspan className='font-semibold tabular-nums'>{fmt(s.valor)}</tspan>
                  <tspan className='fill-muted-foreground'> {s.nombre}</tspan>
                </text>
              </g>
            ))}
            {/* Cruz y puntos del día activo */}
            {punto && activo !== null ? (
              <g>
                <line x1={x(activo)} x2={x(activo)} y1={M.arriba} y2={M.arriba + alto} className='stroke-muted-foreground/60' strokeWidth={1} />
                {SERIES.map((s) => (
                  <circle key={s.clave} cx={x(activo)} cy={y(punto[s.clave])} r={4} strokeWidth={2} className={`fill-background ${s.clase}`} />
                ))}
              </g>
            ) : null}
            {/* Área de captura (más grande que las marcas) */}
            <rect
              x={M.izquierda - 10}
              y={M.arriba}
              width={ancho + 20}
              height={alto}
              fill='transparent'
              onPointerMove={mover}
              onPointerDown={mover}
              onPointerLeave={() => setActivo(null)}
            />
          </svg>
          {punto ? (
            <div
              role='status'
              className='pointer-events-none absolute top-2 z-10 min-w-40 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg'
              style={{ left: `${Math.min(85, Math.max(15, izquierdaTooltip))}%` }}>
              <p className='mb-1 font-medium text-muted-foreground'>{fechaCorta(punto.fecha)}</p>
              {SERIES.map((s) => (
                <p key={s.clave} className='flex items-center justify-between gap-4'>
                  <span className='inline-flex items-center gap-1.5 text-muted-foreground'>
                    <span className={`h-0.5 w-3 rounded-full ${s.relleno}`} aria-hidden='true' />
                    {s.nombre}
                  </span>
                  <strong className='tabular-nums text-foreground'>{fmt(punto[s.clave])}</strong>
                </p>
              ))}
              {punto.rebotes || punto.fallidos ? (
                <p className='mt-1 border-t border-border pt-1 text-muted-foreground'>
                  {fmt(punto.rebotes)} rebotes · {fmt(punto.fallidos)} fallidos
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </figure>
  );
}
