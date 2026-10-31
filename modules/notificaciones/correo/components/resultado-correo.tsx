/** @format */

'use client';

import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Link } from '@/shared/i18n/routing';
import { EstadoEnvioBadge } from '@/modules/administre/email/shared';
import { fechaLocal } from '../../shared';
import type { IEmailResultado } from '../models/correo.interface';

const TITULOS: Record<string, string> = {
  ENVIADO: 'Correo enviado',
  FALLIDO: 'El correo no se pudo enviar',
  CANCELADO: 'Envío cancelado',
  PENDIENTE: 'Correo en cola',
  REINTENTO: 'Correo en reintento',
  EN_PROCESO: 'Correo en proceso',
};

/** Resultado de un correo individual encolado en notificacion (con el estado del proveedor si se esperó). */
export function ResultadoCorreo({ resultado, destino, onNuevo }: { resultado: IEmailResultado; destino: string; onNuevo: () => void }) {
  const ok = resultado.estado === 'ENVIADO';
  const fallo = resultado.estado === 'FALLIDO' || resultado.estado === 'CANCELADO';
  const Icono = ok ? HiOutlineCheckCircle : fallo ? HiOutlineXCircle : HiOutlineClock;
  return (
    <div role='status' className={`space-y-4 rounded-2xl border p-5 ${fallo ? 'border-destructive/40 bg-destructive/5' : 'border-primary/40 bg-primary/5'}`}>
      <div className='flex items-center gap-3'>
        <Icono className={`h-8 w-8 ${fallo ? 'text-destructive' : 'text-primary'}`} />
        <div>
          <p className='text-lg font-semibold text-foreground'>{resultado.programado_para && resultado.estado === 'PENDIENTE' ? 'Correo programado' : TITULOS[resultado.estado] ?? resultado.estado}</p>
          <p className='text-sm text-muted-foreground'>
            Para {destino}
            {resultado.duplicado ? ' · ya existía un envío con la misma clave de idempotencia (no se duplicó)' : ''}
          </p>
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
            <dd className='break-all font-mono text-[11px] text-muted-foreground'>email_gateway {resultado.gateway_envio_id}</dd>
          ) : null}
        </div>
        <div>
          <dt className='text-xs text-muted-foreground'>Tipo</dt>
          <dd>{resultado.tipo_mensaje ?? '--'}</dd>
        </div>
        <div>
          <dt className='text-xs text-muted-foreground'>Proveedor / cuenta</dt>
          <dd>{resultado.proveedor ? `${resultado.proveedor} / ${resultado.cuenta ?? '--'}` : 'Se asigna al procesar'}</dd>
        </div>
        <div>
          <dt className='text-xs text-muted-foreground'>{resultado.programado_para ? 'Programado para' : 'Intentos'}</dt>
          <dd>{resultado.programado_para ? fechaLocal(resultado.programado_para) : resultado.total_intentos ?? 0}</dd>
        </div>
      </dl>
      {resultado.codigo_error || resultado.detalle_error ? (
        <p className='rounded-lg bg-background/60 p-3 text-sm'>
          {resultado.codigo_error ? <span className='font-medium'>{resultado.codigo_error}: </span> : null}
          {resultado.detalle_error}
        </p>
      ) : null}
      {!ok && !fallo ? <p className='text-xs text-muted-foreground'>La cola de notificacion lo entrega a email_gateway, que lo envía en segundo plano; consulta el estado y la entrega en el historial.</p> : null}
      <div className='flex flex-wrap gap-2'>
        <Buttons type='button' onClick={onNuevo}>Enviar otro</Buttons>
        <Link href={`/notificaciones/envios/correo?destino=${encodeURIComponent(destino)}`} className='inline-flex items-center rounded-md border border-border px-3 text-sm hover:bg-muted'>
          Ver en historial
        </Link>
      </div>
    </div>
  );
}
