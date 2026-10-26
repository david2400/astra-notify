/** @format */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineInboxStack, HiOutlinePaperAirplane } from 'react-icons/hi2';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import { cancelarEnvioEmailServerAction, reintentarEnvioEmailServerAction } from '@/app/[locale]/(protected)/administre/email/envios/actions';
import { EmptyState } from '@/components/feedback/empty-state';
import type { ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje/types';
import type { IPlantilla } from '@/server/domains/administre/email/plantillas/types';
import { EstadoEntregaBadge, EstadoEnvioBadge } from '../../shared/components/estado-envio-badge';
import { ManagerHeader } from '../../shared/components/manager-header';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import { fechaCorta } from '../../shared/utils/formato';
import type { IEnvio, IFiltroEnvios, IPagina } from '../models/envio.interface';
import { FormEnvioPrueba } from '../scenes/form-envio-prueba';
import { DetalleEnvio } from './detalle-envio';
import { FiltrosEnvios } from './filtros-envios';

interface Props {
  pagina: IPagina<IEnvio>;
  filtro: IFiltroEnvios;
  tipos: ITipoMensaje[];
  plantillas: IPlantilla[];
}

/** Historial de envíos de email (paginado en el gateway) con detalle, cancelar, reintentar y envío de prueba. */
export function EnvioEmailManager({ pagina, filtro, tipos, plantillas }: Props) {
  const router = useRouter();
  const [detalle, setDetalle] = useState<string | null>(null);
  const [probando, setProbando] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);

  const irAPagina = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filtro)) if (v !== undefined && v !== '' && k !== 'page') q.set(k, String(v));
    q.set('page', String(page));
    router.push(`?${q.toString()}`, { scroll: false });
  };

  const accion = async (e: IEnvio, tipo: 'cancelar' | 'reintentar') => {
    const cancelar = tipo === 'cancelar';
    if (!(await confirmar(cancelar ? '¿Cancelar el envío?' : '¿Reintentar el envío?', cancelar ? 'Solo aplica si aún no se ha entregado.' : 'Se reencola desde el primer paso de su ruta.'))) return;
    setProcesando(e.envio_id);
    const r = await ejecutarAccion(() => (cancelar ? cancelarEnvioEmailServerAction(e.envio_id) : reintentarEnvioEmailServerAction(e.envio_id)), {
      exito: cancelar ? 'Envío cancelado' : 'Envío reencolado',
      error: cancelar ? 'No se pudo cancelar.' : 'No se pudo reintentar.',
    });
    setProcesando(null);
    if (r) router.refresh();
  };

  const opcionesTipo = tipos.map((t) => ({ value: t.codigo, label: t.codigo }));
  const desde = pagina.total_elements === 0 ? 0 : pagina.page * pagina.size + 1;
  const hasta = Math.min((pagina.page + 1) * pagina.size, pagina.total_elements);

  return (
    <section className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <ManagerHeader
          icon={<HiOutlineInboxStack className='h-6 w-6' />}
          title='Envíos'
          description='Historial de la cola: estado de procesamiento, estado de entrega (webhooks), intentos por proveedor y fallback.'
        />
        <Buttons className='inline-flex shrink-0 items-center gap-2' onClick={() => setProbando(true)}>
          <HiOutlinePaperAirplane className='h-4 w-4' />
          Enviar prueba
        </Buttons>
      </div>

      <FiltrosEnvios filtro={filtro} tipos={opcionesTipo} />

      {pagina.content.length === 0 ? (
        <EmptyState title='No hay envíos' description='Ajusta los filtros o haz un envío de prueba.' />
      ) : (
        <div className='overflow-x-auto rounded-2xl border border-border'>
          <table className='w-full min-w-[1100px] text-sm'>
            <thead className='bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-4 py-3'>Creado</th>
                <th className='px-4 py-3'>Destinatario</th>
                <th className='px-4 py-3'>Asunto</th>
                <th className='px-4 py-3'>Tipo</th>
                <th className='px-4 py-3'>Estado</th>
                <th className='px-4 py-3'>Entrega</th>
                <th className='px-4 py-3'>Proveedor</th>
                <th className='px-4 py-3'>Intentos</th>
                <th className='px-4 py-3'>Acciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {pagina.content.map((e) => (
                <tr key={e.envio_id} className='align-top hover:bg-muted/20'>
                  <td className='whitespace-nowrap px-4 py-3 text-xs text-muted-foreground'>{fechaCorta(e.created_at)}</td>
                  <td className='px-4 py-3'>
                    <p className='font-medium text-foreground'>{e.destino_principal}</p>
                    {(e.total_destinatarios ?? 1) > 1 ? <p className='text-xs text-muted-foreground'>+{(e.total_destinatarios ?? 1) - 1} más</p> : null}
                  </td>
                  <td className='max-w-xs px-4 py-3'>
                    <p className='line-clamp-2'>{e.asunto}</p>
                    {e.plantilla ? <p className='text-xs text-muted-foreground'>Plantilla {e.plantilla}</p> : null}
                  </td>
                  <td className='px-4 py-3 text-xs'>{e.tipo_mensaje}</td>
                  <td className='px-4 py-3'>
                    <EstadoEnvioBadge estado={e.estado} />
                    {e.codigo_error ? <p className='mt-1 text-xs text-destructive'>{e.codigo_error}</p> : null}
                  </td>
                  <td className='px-4 py-3'><EstadoEntregaBadge estado={e.estado_entrega} /></td>
                  <td className='px-4 py-3 text-xs'>{e.proveedor ? `${e.proveedor} / ${e.cuenta}` : '--'}</td>
                  <td className='px-4 py-3 text-center'>{e.total_intentos ?? 0}</td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-2'>
                      <Buttons size='sm' variant='outline' onClick={() => setDetalle(e.envio_id)}>Detalle</Buttons>
                      {e.estado === 'PENDIENTE' || e.estado === 'REINTENTO' ? (
                        <Buttons size='sm' variant='ghost' className='text-destructive' loading={procesando === e.envio_id} onClick={() => accion(e, 'cancelar')}>
                          Cancelar
                        </Buttons>
                      ) : null}
                      {e.estado === 'FALLIDO' ? (
                        <Buttons size='sm' variant='ghost' loading={procesando === e.envio_id} onClick={() => accion(e, 'reintentar')}>
                          Reintentar
                        </Buttons>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
        <span className='text-muted-foreground'>
          {desde}–{hasta} de {pagina.total_elements}
        </span>
        <div className='flex gap-2'>
          <Buttons size='sm' variant='outline' disabled={pagina.page <= 0} onClick={() => irAPagina(pagina.page - 1)}>Anterior</Buttons>
          <span className='px-2 py-1 text-muted-foreground'>Página {pagina.page + 1} de {Math.max(1, pagina.total_pages)}</span>
          <Buttons size='sm' variant='outline' disabled={pagina.page + 1 >= pagina.total_pages} onClick={() => irAPagina(pagina.page + 1)}>Siguiente</Buttons>
          <Buttons size='sm' variant='ghost' onClick={() => router.refresh()}>Actualizar</Buttons>
        </div>
      </div>

      <Modal size='xl' title='Detalle del envío' open={detalle !== null} onOpenChange={(open) => !open && setDetalle(null)} hideDefaultFooter>
        {detalle ? <DetalleEnvio envioId={detalle} /> : null}
      </Modal>
      <Modal size='lg' title='Enviar email de prueba' open={probando} onOpenChange={setProbando} hideDefaultFooter>
        <FormEnvioPrueba
          tipos={opcionesTipo}
          plantillas={plantillas.filter((p) => !p.eliminado).map((p) => ({ value: p.codigo, label: `${p.codigo} — ${p.nombre}` }))}
          onEnviado={(id) => {
            setProbando(false);
            setDetalle(id);
          }}
        />
      </Modal>
    </section>
  );
}
