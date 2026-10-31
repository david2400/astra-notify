/** @format */

'use client';

import { useState } from 'react';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Link } from '@/shared/i18n/routing';
import { EstadoEnvioBadge } from '@/modules/administre/email/shared';
import { consultarSmsServerAction } from '@/app/[locale]/(protected)/notificaciones/sms/actions';
import type { ISmsResultado } from '../models/sms.interface';

const fecha = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('es-CO') : null);

/**
 * Resultado de un SMS individual. Sale por la cola de notificacion: si al responder seguía en la cola
 * (reintento programado) se muestra "en proceso" y se puede consultar otra vez.
 */
export function ResultadoSms({ resultado: inicial, destino, onNuevo }: { resultado: ISmsResultado; destino: string; onNuevo: () => void }) {
  const [resultado, setResultado] = useState(inicial);
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ok = resultado.estado === 'ENVIADO';
  const enProceso = resultado.estado === 'EN_PROCESO';

  const actualizar = async () => {
    setConsultando(true);
    setError(null);
    const r = await consultarSmsServerAction(resultado.envio_id);
    setConsultando(false);
    if (r.success) setResultado(r.data);
    else setError(r.error);
  };

  const borde = ok ? 'border-primary/40 bg-primary/5' : enProceso ? 'border-amber-500/40 bg-amber-500/5' : 'border-destructive/40 bg-destructive/5';
  return (
    <div role='status' className={`space-y-4 rounded-2xl border p-5 ${borde}`}>
      <div className='flex items-center gap-3'>
        {ok ? (
          <HiOutlineCheckCircle className='h-8 w-8 text-primary' />
        ) : enProceso ? (
          <HiOutlineClock className='h-8 w-8 text-amber-600' />
        ) : (
          <HiOutlineXCircle className='h-8 w-8 text-destructive' />
        )}
        <div>
          <p className='text-lg font-semibold text-foreground'>{ok ? 'SMS enviado' : resultado.estado === 'FALLIDO' ? 'El SMS no se pudo enviar' : 'SMS en proceso'}</p>
          <p className='text-sm text-muted-foreground'>Destino {destino}</p>
        </div>
        <span className='ml-auto'>
          <EstadoEnvioBadge estado={resultado.estado} />
        </span>
      </div>
      <dl className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-4'>
        <div>
          <dt className='text-xs text-muted-foreground'>Envío (notificacion)</dt>
          <dd className='break-all font-mono text-xs'>{resultado.envio_id}</dd>
          {resultado.gateway_envio_id ? (
            <dd className='break-all font-mono text-[11px] text-muted-foreground'>sms_gateway {resultado.gateway_envio_id}</dd>
          ) : null}
        </div>
        <div>
          <dt className='text-xs text-muted-foreground'>Proveedor / cuenta</dt>
          <dd>{resultado.proveedor ? `${resultado.proveedor} / ${resultado.cuenta ?? '--'}` : '--'}</dd>
        </div>
        <div>
          <dt className='text-xs text-muted-foreground'>Intentos</dt>
          <dd>{resultado.intentos}</dd>
        </div>
        <div>
          <dt className='text-xs text-muted-foreground'>HTTP</dt>
          <dd>{resultado.http_status ?? '--'}</dd>
        </div>
      </dl>
      {enProceso ? (
        <p className='rounded-lg bg-background/60 p-3 text-sm'>
          En la cola de notificacion{resultado.estado_cola ? ` (${resultado.estado_cola})` : ''}
          {resultado.proximo_intento ? `; próximo intento ${fecha(resultado.proximo_intento)}` : ''}. Se reintenta automáticamente.
        </p>
      ) : null}
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      {resultado.codigo_error || resultado.detalle ? (
        <p className='rounded-lg bg-background/60 p-3 text-sm'>
          {resultado.codigo_error ? <span className='font-medium'>{resultado.codigo_error}: </span> : null}
          {resultado.detalle}
        </p>
      ) : null}
      <div className='flex flex-wrap gap-2'>
        <Buttons type='button' onClick={onNuevo}>Enviar otro</Buttons>
        {enProceso ? (
          <Buttons type='button' variant='outline' loading={consultando} disabled={consultando} onClick={actualizar}>
            Actualizar estado
          </Buttons>
        ) : null}
        <Link href={`/notificaciones/envios?destino=${encodeURIComponent(destino)}`} className='inline-flex items-center rounded-md border border-border px-3 text-sm hover:bg-muted'>
          Ver en historial
        </Link>
      </div>
    </div>
  );
}
