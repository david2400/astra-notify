/** @format */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import { EstadoEnvioBadge, type OpcionSelect } from '@/modules/administre/email/shared';
import { EnviosVacio } from '../components/envios-vacio';
import { DetalleSms } from '../components/detalle-sms';
import { FiltrosSms } from '../components/filtros-sms';
import { fechaSms, type IPaginaSms } from '../models/envio.interface';
import type { FiltroSms } from '../schemas/filtro-envios.schemas';

interface Props {
  pagina: IPaginaSms;
  filtro: FiltroSms;
  tipos: OpcionSelect[];
  proveedores: OpcionSelect[];
}

/** Historial de SMS paginado en sms_gateway, con filtros en la URL y detalle de intentos. */
export function HistorialSmsScene({ pagina, filtro, tipos, proveedores }: Props) {
  const router = useRouter();
  const [detalle, setDetalle] = useState<string | null>(null);

  const irAPagina = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filtro)) if (v !== undefined && v !== '' && k !== 'page' && !(k === 'size' && v === 20)) q.set(k, String(v));
    q.set('page', String(page));
    router.push(`?${q.toString()}`, { scroll: false });
  };

  const desde = pagina.total_elements === 0 ? 0 : pagina.page * pagina.size + 1;
  const hasta = Math.min((pagina.page + 1) * pagina.size, pagina.total_elements);

  return (
    <section className='flex flex-col gap-5'>
      <FiltrosSms filtro={filtro} tipos={tipos} proveedores={proveedores} />

      {pagina.content.length === 0 ? (
        <EnviosVacio canal='SMS' />
      ) : (
        <div className='overflow-x-auto rounded-2xl border border-border'>
          <table className='w-full min-w-[960px] text-sm'>
            <thead className='bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-4 py-3'>Creado</th>
                <th className='px-4 py-3'>Destino</th>
                <th className='px-4 py-3'>Mensaje</th>
                <th className='px-4 py-3'>Tipo</th>
                <th className='px-4 py-3'>Estado</th>
                <th className='px-4 py-3'>Proveedor</th>
                <th className='px-4 py-3'>Intentos</th>
                <th className='px-4 py-3'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {pagina.content.map((e) => (
                <tr key={e.envio_id} className='align-top hover:bg-muted/20'>
                  <td className='whitespace-nowrap px-4 py-3 text-xs text-muted-foreground'>{fechaSms(e.fecha_creacion)}</td>
                  <td className='px-4 py-3 font-medium text-foreground'>{e.destino}</td>
                  <td className='max-w-sm px-4 py-3'><p className='line-clamp-2'>{e.mensaje}</p></td>
                  <td className='px-4 py-3 text-xs'>{e.tipo_mensaje}</td>
                  <td className='px-4 py-3'>
                    <EstadoEnvioBadge estado={e.estado} />
                    {e.codigo_error ? <p className='mt-1 text-xs text-destructive'>{e.codigo_error}</p> : null}
                  </td>
                  <td className='px-4 py-3 text-xs'>{e.proveedor_final ? `${e.proveedor_final} / ${e.cuenta_final ?? '--'}` : '--'}</td>
                  <td className='px-4 py-3 text-center'>{e.total_intentos}</td>
                  <td className='px-4 py-3'>
                    <Buttons size='sm' variant='outline' onClick={() => setDetalle(e.envio_id)}>Detalle</Buttons>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
        <span className='text-muted-foreground'>{desde}–{hasta} de {pagina.total_elements}</span>
        <div className='flex gap-2'>
          <Buttons size='sm' variant='outline' disabled={pagina.page <= 0} onClick={() => irAPagina(pagina.page - 1)}>Anterior</Buttons>
          <span className='px-2 py-1 text-muted-foreground'>Página {pagina.page + 1} de {Math.max(1, pagina.total_pages)}</span>
          <Buttons size='sm' variant='outline' disabled={pagina.page + 1 >= pagina.total_pages} onClick={() => irAPagina(pagina.page + 1)}>Siguiente</Buttons>
          <Buttons size='sm' variant='ghost' onClick={() => router.refresh()}>Actualizar</Buttons>
        </div>
      </div>

      <Modal size='xl' title='Detalle del SMS' open={detalle !== null} onOpenChange={(open) => !open && setDetalle(null)} hideDefaultFooter>
        {detalle ? <DetalleSms envioId={detalle} /> : null}
      </Modal>
    </section>
  );
}
