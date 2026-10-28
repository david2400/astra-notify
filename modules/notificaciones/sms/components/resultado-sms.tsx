/** @format */

'use client';

import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Link } from '@/shared/i18n/routing';
import { EstadoEnvioBadge } from '@/modules/administre/email/shared';
import type { ISmsResultado } from '../models/sms.interface';

/** Resultado de un SMS individual (sms_gateway responde de forma síncrona con el estado final). */
export function ResultadoSms({ resultado, destino, onNuevo }: { resultado: ISmsResultado; destino: string; onNuevo: () => void }) {
  const ok = resultado.estado === 'ENVIADO';
  return (
    <div role='status' className={`space-y-4 rounded-2xl border p-5 ${ok ? 'border-primary/40 bg-primary/5' : 'border-destructive/40 bg-destructive/5'}`}>
      <div className='flex items-center gap-3'>
        {ok ? <HiOutlineCheckCircle className='h-8 w-8 text-primary' /> : <HiOutlineXCircle className='h-8 w-8 text-destructive' />}
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
          <dt className='text-xs text-muted-foreground'>Envío</dt>
          <dd className='break-all font-mono text-xs'>{resultado.envio_id}</dd>
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
      {resultado.codigo_error || resultado.detalle ? (
        <p className='rounded-lg bg-background/60 p-3 text-sm'>
          {resultado.codigo_error ? <span className='font-medium'>{resultado.codigo_error}: </span> : null}
          {resultado.detalle}
        </p>
      ) : null}
      <div className='flex flex-wrap gap-2'>
        <Buttons type='button' onClick={onNuevo}>Enviar otro</Buttons>
        <Link href={`/notificaciones/envios?destino=${encodeURIComponent(destino)}`} className='inline-flex items-center rounded-md border border-border px-3 text-sm hover:bg-muted'>
          Ver en historial
        </Link>
      </div>
    </div>
  );
}
