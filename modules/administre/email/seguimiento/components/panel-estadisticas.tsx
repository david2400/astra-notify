/** @format */

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  HiOutlineCursorArrowRays,
  HiOutlineEnvelopeOpen,
  HiOutlineExclamationTriangle,
  HiOutlineInboxArrowDown,
  HiOutlineNoSymbol,
  HiOutlinePaperAirplane,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { obtenerEstadisticasEmailServerAction } from '@/app/[locale]/(protected)/administre/email/envios/actions';
import type { IEstadisticasEnvio, IFiltroEstadisticas } from '@/server/domains/administre/email/envios/types';
import { periodo, TZ_OFFSET } from '../utils/periodo';
import { GraficaSerie } from './grafica-serie';


const PRESETS = [
  { dias: 7, etiqueta: '7 días' },
  { dias: 30, etiqueta: '30 días' },
  { dias: 90, etiqueta: '90 días' },
  { dias: 365, etiqueta: '12 meses' },
];


const fmt = (n: number) => n.toLocaleString('es-CO');
const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`);

function Tarjeta({ icono, titulo, valor, detalle, ayuda }: { icono: ReactNode; titulo: string; valor: string; detalle?: string; ayuda: string }) {
  return (
    <article className='rounded-2xl border border-border bg-card p-4' title={ayuda}>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <span className='text-muted-foreground'>{icono}</span>
        {titulo}
      </div>
      <p className='mt-2 text-2xl font-bold tabular-nums text-foreground'>{valor}</p>
      {detalle ? <p className='mt-0.5 text-xs text-muted-foreground'>{detalle}</p> : null}
    </article>
  );
}

/** Embudo: cada etapa como barra horizontal (un solo tono) con su valor y % sobre enviados. */
function Embudo({ e }: { e: IEstadisticasEnvio }) {
  const t = e.totales;
  const etapas = [
    { nombre: 'Enviados', valor: t.enviados },
    { nombre: 'Entregados', valor: t.entregados },
    { nombre: 'Abiertos', valor: t.abiertos },
    { nombre: 'Con clic', valor: t.clics },
  ];
  const base = Math.max(1, t.enviados);
  return (
    <ul className='space-y-3' aria-label='Embudo de envíos'>
      {etapas.map((s) => {
        const p = (s.valor * 100) / base;
        return (
          <li key={s.nombre} title={`${s.nombre}: ${fmt(s.valor)} (${pct(t.enviados ? p : null)} de los enviados)`}>
            <div className='mb-1 flex items-baseline justify-between text-sm'>
              <span className='text-muted-foreground'>{s.nombre}</span>
              <span>
                <strong className='tabular-nums text-foreground'>{fmt(s.valor)}</strong>{' '}
                <span className='text-xs text-muted-foreground'>{t.enviados ? pct(p) : ''}</span>
              </span>
            </div>
            <div className='h-3 overflow-hidden rounded-r bg-muted'>
              <div className='h-full rounded-r bg-[#2a78d6] transition-[width] duration-500 dark:bg-[#3987e5]' style={{ width: `${Math.min(100, p)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Problemas de entrega con ícono + texto (nunca solo color). */
function Problemas({ e }: { e: IEstadisticasEnvio }) {
  const t = e.totales;
  const filas = [
    { icono: <HiOutlineExclamationTriangle className='h-4 w-4 text-amber-600' />, nombre: 'Rebotes suaves', valor: t.rebotes_suaves, ayuda: 'Buzón lleno o servidor no disponible: el proveedor reintenta.' },
    { icono: <HiOutlineXCircle className='h-4 w-4 text-red-600' />, nombre: 'Rebotes duros', valor: t.rebotes_duros, ayuda: 'Dirección inexistente o inválida.' },
    { icono: <HiOutlineNoSymbol className='h-4 w-4 text-red-600' />, nombre: 'Spam', valor: t.spam, ayuda: 'El destinatario lo marcó como spam.' },
    { icono: <HiOutlineNoSymbol className='h-4 w-4 text-amber-600' />, nombre: 'Desuscritos', valor: t.desuscritos, ayuda: 'Se dieron de baja.' },
    { icono: <HiOutlineXCircle className='h-4 w-4 text-red-600' />, nombre: 'Bloqueados / error', valor: t.bloqueados, ayuda: 'El proveedor bloqueó el envío.' },
    { icono: <HiOutlineXCircle className='h-4 w-4 text-red-600' />, nombre: 'Fallidos (no enviados)', valor: t.fallidos, ayuda: 'Ningún proveedor aceptó el correo tras los reintentos.' },
    { icono: <HiOutlineInboxArrowDown className='h-4 w-4 text-muted-foreground' />, nombre: 'En cola', valor: t.en_cola, ayuda: 'Pendientes, en proceso o esperando reintento.' },
  ];
  return (
    <ul className='divide-y divide-border text-sm'>
      {filas.map((f) => (
        <li key={f.nombre} className='flex items-center justify-between gap-3 py-2' title={f.ayuda}>
          <span className='inline-flex items-center gap-2 text-muted-foreground'>
            {f.icono}
            {f.nombre}
          </span>
          <strong className='tabular-nums text-foreground'>{fmt(f.valor)}</strong>
        </li>
      ))}
    </ul>
  );
}

/**
 * Seguimiento estilo Brevo: periodo (presets o rango), tarjetas, serie diaria, embudo y problemas de entrega.
 * Los datos vienen de los webhooks del proveedor (Brevo); con proveedores sin webhooks solo hay enviados/fallidos.
 */
export function PanelEstadisticas({ inicial, plantilla, diasIniciales = 30 }: { inicial: IEstadisticasEnvio; plantilla?: string; diasIniciales?: number }) {
  const [datos, setDatos] = useState(inicial);
  const [dias, setDias] = useState<number | null>(diasIniciales);
  const [rango, setRango] = useState({ desde: inicial.desde.slice(0, 10), hasta: inicial.hasta.slice(0, 10) });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const peticion = useRef(0);

  useEffect(() => setDatos(inicial), [inicial]);

  const cargar = async (filtro: IFiltroEstadisticas) => {
    const n = ++peticion.current;
    setCargando(true);
    setError(null);
    const r = await obtenerEstadisticasEmailServerAction({ ...filtro, plantilla, tz_offset: TZ_OFFSET });
    if (n !== peticion.current) return;
    setCargando(false);
    if (r.success) setDatos(r.data);
    else setError(r.error);
  };

  const elegirPreset = (d: number) => {
    setDias(d);
    void cargar(periodo(d));
  };

  const aplicarRango = () => {
    if (!rango.desde || !rango.hasta) return;
    setDias(null);
    // Fechas locales (Colombia) → instante UTC
    const desde = new Date(`${rango.desde}T00:00:00-05:00`).toISOString();
    const hasta = new Date(new Date(`${rango.hasta}T00:00:00-05:00`).getTime() + 86400000).toISOString();
    void cargar({ desde, hasta });
  };

  const t = datos.totales;
  const tasas = datos.tasas;

  return (
    <section className='space-y-4' aria-busy={cargando}>
      {/* Filtros: una fila arriba de todo */}
      <div className='flex flex-wrap items-end gap-3'>
        <div className='inline-flex rounded-xl bg-muted p-1' role='group' aria-label='Periodo'>
          {PRESETS.map((p) => (
            <button
              key={p.dias}
              type='button'
              aria-pressed={dias === p.dias}
              onClick={() => elegirPreset(p.dias)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${dias === p.dias ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {p.etiqueta}
            </button>
          ))}
        </div>
        <div className='flex flex-wrap items-end gap-2'>
          <label className='space-y-1 text-xs text-muted-foreground'>
            <span className='block'>Desde</span>
            <input type='date' value={rango.desde} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} className='h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground' />
          </label>
          <label className='space-y-1 text-xs text-muted-foreground'>
            <span className='block'>Hasta</span>
            <input type='date' value={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} className='h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground' />
          </label>
          <button type='button' onClick={aplicarRango} className='h-9 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted'>
            Aplicar
          </button>
        </div>
      </div>
      {error ? <p className='rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{error}</p> : null}

      <div className={`space-y-4 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
          <Tarjeta icono={<HiOutlinePaperAirplane className='h-4 w-4' />} titulo='Enviados' valor={fmt(t.enviados)} detalle={`${fmt(t.total)} solicitados`} ayuda='Aceptados por el proveedor.' />
          <Tarjeta icono={<HiOutlineInboxArrowDown className='h-4 w-4' />} titulo='Entregados' valor={pct(tasas.entrega)} detalle={`${fmt(t.entregados)} correos`} ayuda='Entregados / enviados.' />
          <Tarjeta icono={<HiOutlineEnvelopeOpen className='h-4 w-4' />} titulo='Aperturas' valor={pct(tasas.apertura)} detalle={`${fmt(t.abiertos)} únicas · ${fmt(t.aperturas_totales)} totales`} ayuda='Abiertos / entregados.' />
          <Tarjeta icono={<HiOutlineCursorArrowRays className='h-4 w-4' />} titulo='Clics' valor={pct(tasas.clic)} detalle={`${fmt(t.clics)} únicos · ${pct(tasas.clic_sobre_apertura)} de los abiertos`} ayuda='Con clic / entregados.' />
          <Tarjeta icono={<HiOutlineXCircle className='h-4 w-4' />} titulo='Rebotes' valor={pct(tasas.rebote)} detalle={`${fmt(t.rebotes_suaves + t.rebotes_duros)} correos`} ayuda='Rebotes suaves + duros / enviados.' />
          <Tarjeta icono={<HiOutlineNoSymbol className='h-4 w-4' />} titulo='Bajas y spam' valor={fmt(t.desuscritos + t.spam)} detalle={`${pct(tasas.desuscripcion)} bajas · ${pct(tasas.spam)} spam`} ayuda='Desuscritos y quejas de spam.' />
        </div>

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]'>
          <article className='rounded-2xl border border-border bg-card p-4'>
            <h3 className='mb-3 text-sm font-semibold text-foreground'>Actividad por día</h3>
            {t.total ? (
              <GraficaSerie serie={datos.serie} desde={datos.desde} hasta={datos.hasta} tzOffset={TZ_OFFSET} />
            ) : (
              <p className='rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground'>No hay envíos en este periodo.</p>
            )}
          </article>
          <div className='space-y-4'>
            <article className='rounded-2xl border border-border bg-card p-4'>
              <h3 className='mb-3 text-sm font-semibold text-foreground'>Embudo</h3>
              <Embudo e={datos} />
            </article>
            <article className='rounded-2xl border border-border bg-card p-4'>
              <h3 className='mb-1 text-sm font-semibold text-foreground'>Problemas de entrega</h3>
              <Problemas e={datos} />
            </article>
          </div>
        </div>
        <p className='text-xs text-muted-foreground'>
          Cada correo cuenta una vez por métrica (un clic implica apertura y entrega). Aperturas y clics llegan por los webhooks del proveedor (Brevo); los envíos por
          proveedores sin webhooks solo cuentan como enviados.
        </p>
      </div>
    </section>
  );
}
