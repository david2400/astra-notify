/** @format */

'use client';

import { Badge } from '@repo/ui/badges/scenes/badge';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Link } from '@/shared/i18n/routing';
import type { IEmailLoteResultado } from '../models/correo.interface';

/** Resultado de un lote encolado en notificacion: aceptados, en cola y errores por destinatario (fila del CSV = índice + 1). */
export function ResultadoLoteCorreo({ resultado, lineas, onNuevo, onCorregir }: { resultado: IEmailLoteResultado; lineas: number[]; onNuevo: () => void; onCorregir: () => void }) {
  const rechazadoTodo = resultado.aceptados === 0 && resultado.rechazados > 0;
  const errores = resultado.errores ?? [];
  return (
    <div role='status' className={`space-y-4 rounded-2xl border p-5 ${rechazadoTodo ? 'border-destructive/40 bg-destructive/5' : 'border-primary/40 bg-primary/5'}`}>
      <div className='flex flex-wrap items-center gap-3'>
        <p className='text-lg font-semibold text-foreground'>{rechazadoTodo ? 'El lote fue rechazado' : resultado.duplicado ? 'Lote ya registrado (idempotencia)' : 'Lote encolado'}</p>
        <Badge variant='outline'>{resultado.total} total</Badge>
        <Badge variant='default'>{resultado.aceptados} aceptados</Badge>
        {resultado.rechazados ? <Badge variant='destructive'>{resultado.rechazados} con error</Badge> : null}
        {resultado.en_cola ? <Badge variant='outline'>{resultado.en_cola} aún en la cola</Badge> : null}
      </div>
      {resultado.lote_id ? (
        <p className='text-sm text-muted-foreground'>
          Lote <span className='font-mono text-xs'>{resultado.lote_id}</span>. Los correos se envían en segundo plano; el estado y la entrega se ven en el historial.
        </p>
      ) : null}
      {errores.length ? (
        <div className='max-h-80 overflow-auto rounded-xl border border-border bg-background'>
          <table className='w-full text-sm'>
            <thead className='sticky top-0 bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-3 py-2'>Fila</th>
                <th className='px-3 py-2'>Email</th>
                <th className='px-3 py-2'>Error</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {errores.map((e) => (
                <tr key={`${e.indice}-${e.email}`}>
                  <td className='px-3 py-2 text-xs'>{lineas[e.indice] ?? e.indice + 1}</td>
                  <td className='px-3 py-2 font-mono text-xs'>{e.email}</td>
                  <td className='px-3 py-2 text-xs'>
                    <span className='font-medium'>{e.codigo}</span>: {e.mensaje}
                    {e.variables?.length ? <span className='text-muted-foreground'> ({e.variables.map((v) => `${v.variable ?? ''} ${v.mensaje}`.trim()).join('; ')})</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className='flex flex-wrap gap-2'>
        {rechazadoTodo ? <Buttons type='button' onClick={onCorregir}>Corregir y reintentar</Buttons> : null}
        <Buttons type='button' variant={rechazadoTodo ? 'outline' : 'default'} onClick={onNuevo}>Nuevo envío</Buttons>
        {resultado.lote_id && resultado.aceptados > 0 ? (
          <Link href={`/notificaciones/envios/correo?lote_id=${encodeURIComponent(resultado.lote_id)}`} className='inline-flex items-center rounded-md border border-border px-3 text-sm hover:bg-muted'>
            Ver lote en historial
          </Link>
        ) : null}
      </div>
    </div>
  );
}
