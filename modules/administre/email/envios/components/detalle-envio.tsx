/** @format */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { obtenerDetalleEnvioEmailServerAction } from '@/app/[locale]/(protected)/administre/email/envios/actions';
import { EstadoEntregaBadge, EstadoEnvioBadge } from '../../shared/components/estado-envio-badge';
import { fechaCorta } from '../../shared/utils/formato';
import type { IEnvioDetalle } from '../models/envio.interface';

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

/** Detalle completo: destinatarios, resultado, adjuntos, intentos por paso y eventos de entrega. */
export function DetalleEnvio({ envioId }: { envioId: string }) {
  const [detalle, setDetalle] = useState<IEnvioDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  );
}
