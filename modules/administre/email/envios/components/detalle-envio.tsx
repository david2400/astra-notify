/** @format */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineCursorArrowRays,
  HiOutlineEnvelopeOpen,
  HiOutlineExclamationTriangle,
  HiOutlineInboxArrowDown,
  HiOutlineNoSymbol,
  HiOutlinePaperAirplane,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { obtenerDetalleEnvioEmailServerAction } from '@/app/[locale]/(protected)/administre/email/envios/actions';
import { EstadoEntregaBadge, EstadoEnvioBadge } from '../../shared/components/estado-envio-badge';
import { fechaCorta } from '../../shared/utils/formato';
import type { IEnvioDetalle } from '../models/envio.interface';
import { VistaHtml } from '../../plantillas/components/vista-html';

const direcciones = (lista?: { email: string; nombre?: string }[]) =>
  lista?.length ? lista.map((d) => (d.nombre ? `${d.nombre} <${d.email}>` : d.email)).join(', ') : null;

function Fila({ etiqueta, valor }: { etiqueta: string; valor?: React.ReactNode }) {
  if (valor === undefined || valor === null || valor === '') return null;
  return (
    <div className='grid grid-cols-3 gap-2 py-1 text-sm'>
      <dt className='text-muted-foreground'>{etiqueta}</dt>
      <dd className='col-span-2 break-words text-foreground'>{valor}</dd>
    </div>
  );
}

type Tono = 'ok' | 'info' | 'alerta' | 'error';
const ICONO_ESTADO: Record<string, { icono: ReactNode; tono: Tono; titulo: string }> = {
  SOLICITADO: { icono: <HiOutlinePaperAirplane className='h-4 w-4' />, tono: 'info', titulo: 'Aceptado por el proveedor' },
  DIFERIDO: { icono: <HiOutlineExclamationTriangle className='h-4 w-4' />, tono: 'alerta', titulo: 'Entrega diferida' },
  REBOTE_SUAVE: { icono: <HiOutlineExclamationTriangle className='h-4 w-4' />, tono: 'alerta', titulo: 'Rebote suave' },
  ENTREGADO: { icono: <HiOutlineInboxArrowDown className='h-4 w-4' />, tono: 'ok', titulo: 'Entregado' },
  ABIERTO: { icono: <HiOutlineEnvelopeOpen className='h-4 w-4' />, tono: 'ok', titulo: 'Abierto' },
  CLIC: { icono: <HiOutlineCursorArrowRays className='h-4 w-4' />, tono: 'ok', titulo: 'Clic en un enlace' },
  DESUSCRITO: { icono: <HiOutlineNoSymbol className='h-4 w-4' />, tono: 'alerta', titulo: 'Se dio de baja' },
  SPAM: { icono: <HiOutlineNoSymbol className='h-4 w-4' />, tono: 'error', titulo: 'Marcado como spam' },
  REBOTE_DURO: { icono: <HiOutlineXCircle className='h-4 w-4' />, tono: 'error', titulo: 'Rebote duro' },
  INVALIDO: { icono: <HiOutlineXCircle className='h-4 w-4' />, tono: 'error', titulo: 'Dirección inválida' },
  BLOQUEADO: { icono: <HiOutlineXCircle className='h-4 w-4' />, tono: 'error', titulo: 'Bloqueado' },
  ERROR: { icono: <HiOutlineXCircle className='h-4 w-4' />, tono: 'error', titulo: 'Error del proveedor' },
};
const CLASE_TONO: Record<Tono, string> = {
  ok: 'bg-emerald-600 text-white',
  info: 'bg-primary text-primary-foreground',
  alerta: 'bg-amber-500 text-white',
  error: 'bg-destructive text-white',
};

interface Hito {
  titulo: string;
  detalle?: string | null;
  fecha?: string | null;
  icono: ReactNode;
  tono: Tono;
}

/** Línea de tiempo del correo (como los logs de Brevo): creado → enviado → eventos del webhook. */
function LineaTiempo({ d }: { d: IEnvioDetalle }) {
  const e = d.envio;
  const hitos: Hito[] = [{ titulo: 'Creado en la cola', detalle: e.plantilla ? `Plantilla ${e.plantilla}${d.plantilla_version ? ` v${d.plantilla_version}` : ''}` : null, fecha: e.created_at, icono: <HiOutlinePaperAirplane className='h-4 w-4' />, tono: 'info' }];
  if (e.estado === 'ENVIADO') {
    hitos.push({ titulo: 'Enviado', detalle: e.proveedor ? `${e.proveedor} / ${e.cuenta}` : null, fecha: e.fecha_finalizacion, icono: <HiOutlineCheckCircle className='h-4 w-4' />, tono: 'ok' });
  } else if (e.estado === 'FALLIDO') {
    hitos.push({ titulo: 'No se pudo enviar', detalle: e.codigo_error ? `${e.codigo_error}: ${e.detalle_error ?? ''}` : null, fecha: e.fecha_finalizacion, icono: <HiOutlineXCircle className='h-4 w-4' />, tono: 'error' });
  } else if (e.estado === 'CANCELADO') {
    hitos.push({ titulo: 'Cancelado', fecha: e.fecha_finalizacion, icono: <HiOutlineNoSymbol className='h-4 w-4' />, tono: 'alerta' });
  } else {
    hitos.push({ titulo: e.estado === 'REINTENTO' ? 'Esperando reintento' : 'En cola', detalle: e.proximo_intento ? `Próximo intento ${fechaCorta(e.proximo_intento)}` : null, icono: <HiOutlinePaperAirplane className='h-4 w-4' />, tono: 'alerta' });
  }
  for (const ev of d.eventos ?? []) {
    const info = (ev.estado_entrega && ICONO_ESTADO[ev.estado_entrega]) || { icono: <HiOutlineCheckCircle className='h-4 w-4' />, tono: 'info' as Tono, titulo: ev.evento };
    hitos.push({ titulo: info.titulo, detalle: [ev.email, ev.motivo].filter(Boolean).join(' · ') || null, fecha: ev.fecha_evento, icono: info.icono, tono: info.tono });
  }
  return (
    <ol className='relative space-y-4 border-l border-border pl-6'>
      {hitos.map((h, i) => (
        <li key={i} className='relative'>
          <span className={`absolute -left-[35px] top-0 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background ${CLASE_TONO[h.tono]}`}>{h.icono}</span>
          <div className='flex flex-wrap items-baseline justify-between gap-2'>
            <p className='text-sm font-semibold text-foreground'>{h.titulo}</p>
            <time className='text-xs text-muted-foreground'>{h.fecha ? fechaCorta(h.fecha) : ''}</time>
          </div>
          {h.detalle ? <p className='break-words text-xs text-muted-foreground'>{h.detalle}</p> : null}
        </li>
      ))}
      {!d.eventos?.length && e.estado === 'ENVIADO' ? (
        <li className='text-xs text-muted-foreground'>Sin eventos de entrega todavía (llegan por el webhook del proveedor, p. ej. Brevo).</li>
      ) : null}
    </ol>
  );
}

/** Detalle completo: destinatarios, resultado, adjuntos, intentos por paso y eventos de entrega. */
export function DetalleEnvio({ envioId }: { envioId: string }) {
  const [detalle, setDetalle] = useState<IEnvioDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<'resumen' | 'contenido' | 'tecnico'>('resumen');

  useEffect(() => {
    let vigente = true;
    obtenerDetalleEnvioEmailServerAction(envioId).then((r) => {
      if (!vigente) return;
      if (r.success) setDetalle(r.data);
      else setError(r.error);
    });
    return () => {
      vigente = false;
    };
  }, [envioId]);

  if (error) return <p className='text-sm text-destructive'>{error}</p>;
  if (!detalle) return <p className='text-sm text-muted-foreground'>Cargando detalle...</p>;
  const e = detalle.envio;

  const pestanas = [
    { id: 'resumen' as const, etiqueta: 'Línea de tiempo' },
    { id: 'contenido' as const, etiqueta: 'Contenido enviado' },
    { id: 'tecnico' as const, etiqueta: `Intentos (${detalle.intentos?.length ?? 0})` },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <EstadoEnvioBadge estado={e.estado} />
        <EstadoEntregaBadge estado={e.estado_entrega} />
        <Badge variant='outline'>{e.tipo_mensaje}</Badge>
        {e.plantilla ? <Badge variant='secondary'>Plantilla {e.plantilla}</Badge> : null}
      </div>
      <dl className='divide-y divide-border rounded-xl border border-border px-4'>
        <Fila etiqueta='Envío' valor={<span className='font-mono text-xs'>{e.envio_id}</span>} />
        <Fila etiqueta='Lote' valor={e.lote_id ? <span className='font-mono text-xs'>{e.lote_id}</span> : null} />
        <Fila etiqueta='Asunto' valor={e.asunto} />
        <Fila etiqueta='Para' valor={direcciones(detalle.para)} />
        <Fila etiqueta='CC' valor={direcciones(detalle.cc)} />
        <Fila etiqueta='CCO' valor={direcciones(detalle.cco)} />
        <Fila etiqueta='Canal / prioridad' valor={`${e.canal ?? 'CENTRAL'} · ${e.prioridad ?? '--'}`} />
        <Fila etiqueta='Proveedor / cuenta' valor={e.proveedor ? `${e.proveedor} / ${e.cuenta}` : null} />
        <Fila etiqueta='Message-ID' valor={e.provider_message_id ? <span className='font-mono text-xs'>{e.provider_message_id}</span> : null} />
        <Fila etiqueta='Error' valor={e.codigo_error ? `${e.codigo_error}: ${e.detalle_error ?? ''}` : null} />
        <Fila etiqueta='Creado' valor={fechaCorta(e.created_at)} />
        <Fila etiqueta='Programado para' valor={e.programado_para ? fechaCorta(e.programado_para) : null} />
        <Fila etiqueta='Próximo intento' valor={e.proximo_intento ? fechaCorta(e.proximo_intento) : null} />
        <Fila etiqueta='Finalizado' valor={e.fecha_finalizacion ? fechaCorta(e.fecha_finalizacion) : null} />
      </dl>

      <div role='tablist' aria-label='Detalle del envío' className='flex gap-1 border-b border-border'>
        {pestanas.map((p) => (
          <button
            key={p.id}
            type='button'
            role='tab'
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${pestana === p.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'resumen' ? <LineaTiempo d={detalle} /> : null}

      {pestana === 'contenido' ? (
        <section className='space-y-3'>
          <p className='rounded-lg border border-border bg-muted/30 p-3 text-sm'>
            <span className='text-xs uppercase tracking-wider text-muted-foreground'>Asunto: </span>
            <strong>{e.asunto ?? '—'}</strong>
          </p>
          {detalle.cuerpo_html ? (
            <VistaHtml html={detalle.cuerpo_html} titulo='Correo enviado' alto={480} />
          ) : detalle.cuerpo_texto ? (
            <p className='whitespace-pre-wrap rounded-xl border border-border p-4 text-sm'>{detalle.cuerpo_texto}</p>
          ) : (
            <p className='text-sm text-muted-foreground'>El contenido ya no está disponible (se depura después de un tiempo).</p>
          )}
        </section>
      ) : null}

      <div hidden={pestana !== 'tecnico'} className='space-y-6'>

      {detalle.adjuntos?.length ? (
        <section className='space-y-2'>
          <h3 className='text-sm font-semibold'>Adjuntos</h3>
          <ul className='space-y-1 text-sm'>
            {detalle.adjuntos.map((a, i) => (
              <li key={i} className='flex flex-wrap items-center gap-2'>
                <span className='font-medium'>{a.nombre}</span>
                <span className='text-xs text-muted-foreground'>
                  {a.content_type} · {a.tamano_bytes ? `${Math.ceil(a.tamano_bytes / 1024)} KB` : a.url}
                </span>
                {a.content_id ? <Badge variant='outline'>inline</Badge> : null}
                {a.compartido ? <Badge variant='secondary'>del lote</Badge> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className='space-y-2'>
        <h3 className='text-sm font-semibold'>Intentos ({detalle.intentos?.length ?? 0})</h3>
        {detalle.intentos?.length ? (
          <ol className='space-y-2'>
            {detalle.intentos.map((i) => (
              <li key={i.nro_intento} className='rounded-lg border border-border p-3 text-sm'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span>
                    <strong>#{i.nro_intento}</strong> · paso {i.paso_orden} · {i.proveedor}/{i.cuenta}
                  </span>
                  <span className='flex items-center gap-2'>
                    {i.codigo_respuesta ? <Badge variant='outline'>{i.codigo_respuesta}</Badge> : null}
                    {i.exitoso ? <Badge variant='default'>OK</Badge> : <Badge variant='destructive'>Falló</Badge>}
                    <span className='text-xs text-muted-foreground'>{i.duracion_ms} ms · {fechaCorta(i.fecha)}</span>
                  </span>
                </div>
                {i.detalle ? <p className='mt-1 break-words text-xs text-muted-foreground'>{i.detalle}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className='text-sm text-muted-foreground'>Aún no hay intentos.</p>
        )}
      </section>

      <section className='space-y-2'>
        <h3 className='text-sm font-semibold'>Eventos de entrega ({detalle.eventos?.length ?? 0})</h3>
        {detalle.eventos?.length ? (
          <ul className='space-y-1 text-sm'>
            {detalle.eventos.map((ev, i) => (
              <li key={i} className='flex flex-wrap items-center gap-2'>
                <EstadoEntregaBadge estado={ev.estado_entrega} />
                <span className='font-mono text-xs'>{ev.evento}</span>
                <span className='text-xs text-muted-foreground'>{fechaCorta(ev.fecha_evento)}</span>
                {ev.motivo ? <span className='text-xs text-destructive'>{ev.motivo}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>Sin eventos (llegan por el webhook del proveedor, p. ej. Brevo).</p>
        )}
      </section>
      </div>
    </div>
  );
}
