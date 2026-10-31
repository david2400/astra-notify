/** @format */

'use client';

import { useState } from 'react';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { Buttons } from '@repo/ui/buttons/scenes';
import { consultarSmsLoteServerAction } from '@/app/[locale]/(protected)/notificaciones/sms/actions';
import { EstadoEnvioBadge } from '@/modules/administre/email/shared';
import { descargarCsv } from '../../shared';
import type { ISmsLoteResultado } from '../models/sms.interface';

const csv = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Resumen de un envío masivo de la cola de notificacion: totales y detalle por destinatario (en el orden enviado),
 * descargable en CSV. Mientras queden bloques en la cola se puede consultar otra vez.
 */
export function ResultadoLoteSms({ resultado: inicial, destinos, onNuevo }: { resultado: ISmsLoteResultado; destinos: string[]; onNuevo: () => void }) {
  const [resultado, setResultado] = useState(inicial);
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soloFallidos, setSoloFallidos] = useState(inicial.fallidos > 0);

  const actualizar = async () => {
    if (!resultado.lote_id) return;
    setConsultando(true);
    setError(null);
    const r = await consultarSmsLoteServerAction(
      { lote_id: resultado.lote_id, envios: resultado.envios, total_destinatarios: resultado.total },
      resultado.plantilla,
    );
    setConsultando(false);
    if (r.success) setResultado(r.data);
    else setError(r.error);
  };
  const filas = resultado.resultados.map((r, i) => ({ ...r, destino: destinos[i] ?? '' }));
  const visibles = soloFallidos ? filas.filter((f) => f.estado !== 'ENVIADO') : filas;

  const descargar = () =>
    descargarCsv(
      `resultado-sms-${resultado.lote_id ?? 'lote'}.csv`,
      ['destino,estado,envio_id,proveedor,cuenta,intentos,codigo_error,detalle', ...filas.map((f) => [f.destino, f.estado, f.envio_id, f.proveedor, f.cuenta, f.intentos, f.codigo_error, f.detalle].map(csv).join(','))].join('\n'),
    );

  return (
    <div role='status' className='space-y-4 rounded-2xl border border-border p-5'>
      <div className='flex flex-wrap items-center gap-3'>
        <p className='text-lg font-semibold text-foreground'>{resultado.finalizado ? 'Envío masivo procesado' : 'Envío masivo en curso'}</p>
        <Badge variant='outline'>{resultado.total} total</Badge>
        <Badge variant='default'>{resultado.enviados} enviados</Badge>
        {resultado.fallidos ? <Badge variant='destructive'>{resultado.fallidos} fallidos</Badge> : null}
        {resultado.pendientes ? <Badge variant='outline'>{resultado.pendientes} en cola</Badge> : null}
        {resultado.lote_id ? <span className='font-mono text-xs text-muted-foreground'>Lote {resultado.lote_id}</span> : null}
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' checked={soloFallidos} onChange={(e) => setSoloFallidos(e.target.checked)} className='accent-primary' />
          Solo no enviados
        </label>
        <Buttons type='button' size='sm' variant='outline' onClick={descargar}>Descargar resultado (CSV)</Buttons>
        {!resultado.finalizado && resultado.lote_id ? (
          <Buttons type='button' size='sm' variant='outline' loading={consultando} disabled={consultando} onClick={actualizar}>
            Actualizar
          </Buttons>
        ) : null}
        <Buttons type='button' size='sm' onClick={onNuevo}>Nuevo envío</Buttons>
      </div>
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      {visibles.length ? (
        <div className='max-h-96 overflow-auto rounded-xl border border-border'>
          <table className='w-full text-sm'>
            <thead className='sticky top-0 bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-3 py-2'>Destino</th>
                <th className='px-3 py-2'>Estado</th>
                <th className='px-3 py-2'>Proveedor</th>
                <th className='px-3 py-2'>Detalle</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {visibles.slice(0, 500).map((f, i) => (
                <tr key={`${f.envio_id}-${i}`}>
                  <td className='px-3 py-2 font-mono text-xs'>{f.destino}</td>
                  <td className='px-3 py-2'><EstadoEnvioBadge estado={f.estado} /></td>
                  <td className='px-3 py-2 text-xs'>{f.proveedor ? `${f.proveedor} / ${f.cuenta ?? '--'}` : '--'}</td>
                  <td className='px-3 py-2 text-xs text-muted-foreground'>{[f.codigo_error, f.detalle].filter(Boolean).join(': ') || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibles.length > 500 ? <p className='p-2 text-center text-xs text-muted-foreground'>Se muestran 500 de {visibles.length}; descarga el CSV para ver todos.</p> : null}
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>{soloFallidos ? 'Ningún SMS quedó sin enviar.' : 'Sin destinatarios.'}</p>
      )}
    </div>
  );
}
