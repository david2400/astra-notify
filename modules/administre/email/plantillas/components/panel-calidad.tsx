/** @format */

'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { HiCheck, HiOutlineExclamationTriangle, HiOutlineInformationCircle, HiOutlineLink, HiOutlineXMark } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { verificarEnlacesEmailServerAction } from '@/app/[locale]/(protected)/administre/email/plantillas/actions';
import { ejecutarAccion } from '../../shared/utils/feedback';
import type { IEnlaceVerificado, ResultadoEnlace } from '../models/plantilla.interface';
import { analizarCalidad, type NivelCalidad } from '../editor/utils/calidad';

const ICONO: Record<NivelCalidad, { clase: string; icono: React.ReactNode }> = {
  ok: { clase: 'bg-emerald-600 text-white', icono: <HiCheck className='h-3 w-3' /> },
  info: { clase: 'bg-sky-600 text-white', icono: <HiOutlineInformationCircle className='h-3 w-3' /> },
  aviso: { clase: 'bg-amber-500 text-white', icono: <HiOutlineExclamationTriangle className='h-3 w-3' /> },
  error: { clase: 'bg-destructive text-white', icono: <HiOutlineXMark className='h-3 w-3' /> },
};

const ENLACE: Record<ResultadoEnlace, { texto: string; clase: string }> = {
  OK: { texto: 'OK', clase: 'text-emerald-700 dark:text-emerald-400' },
  REDIRECCION: { texto: 'Redirige', clase: 'text-sky-700 dark:text-sky-400' },
  ROTO: { texto: 'Roto', clase: 'text-destructive' },
  NO_VERIFICABLE: { texto: 'No verificable', clase: 'text-muted-foreground' },
  BLOQUEADO: { texto: 'Bloqueado', clase: 'text-amber-700' },
  ERROR: { texto: 'Error', clase: 'text-destructive' },
};

/**
 * Validación de calidad antes de guardar o enviar: puntuación, recomendaciones por categoría y verificación
 * de enlaces en el gateway (sin seguir a IPs internas).
 */
export function PanelCalidad({ asunto, html, texto, tipoMensaje }: { asunto: string; html: string; texto: string; tipoMensaje?: string | null }) {
  // El análisis recorre el HTML: se difiere para no frenar la escritura.
  const dAsunto = useDeferredValue(asunto);
  const dHtml = useDeferredValue(html);
  const dTexto = useDeferredValue(texto);
  // DOMParser solo existe en el navegador: se analiza tras montar para que SSR e hidratación coincidan.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const r = useMemo(
    () => (montado ? analizarCalidad({ asunto: dAsunto, html: dHtml, texto: dTexto, tipoMensaje }) : null),
    [montado, dAsunto, dHtml, dTexto, tipoMensaje],
  );
  const [verOk, setVerOk] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [enlaces, setEnlaces] = useState<IEnlaceVerificado[] | null>(null);

  if (!r) return <div className='rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground'>Analizando calidad…</div>;
  const errores = r.items.filter((i) => i.nivel === 'error').length;
  const avisos = r.items.filter((i) => i.nivel === 'aviso').length;
  const visibles = verOk ? r.items : r.items.filter((i) => i.nivel !== 'ok');
  const tono = errores ? 'text-destructive' : avisos ? 'text-amber-600' : 'text-emerald-600';

  const verificar = async () => {
    setVerificando(true);
    const res = await ejecutarAccion(() => verificarEnlacesEmailServerAction(r.enlacesVerificables), { error: 'No se pudieron verificar los enlaces.' });
    setVerificando(false);
    if (res) setEnlaces(res);
  };
  const rotos = enlaces?.filter((e) => e.resultado === 'ROTO' || e.resultado === 'ERROR').length ?? 0;

  return (
    <div className='space-y-3 rounded-2xl border border-border bg-background p-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h3 className='text-sm font-semibold'>Calidad del correo</h3>
          <p className='text-xs text-muted-foreground'>
            {errores ? `${errores} error(es)` : 'Sin errores'} · {avisos} aviso(s)
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-current text-sm font-bold tabular-nums ${tono}`} title='Puntuación de calidad'>
          {r.puntuacion}
        </div>
      </div>
      <ul className='space-y-2 text-sm'>
        {visibles.map((i) => (
          <li key={i.id} className='flex items-start gap-2'>
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ICONO[i.nivel].clase}`}>{ICONO[i.nivel].icono}</span>
            <div className='min-w-0'>
              <p className='leading-5'>
                <span className='mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>{i.categoria}</span>
                {i.titulo}
              </p>
              {i.detalle ? <p className='text-xs text-muted-foreground'>{i.detalle}</p> : null}
              {i.ejemplos?.length ? (
                <ul className='mt-1 space-y-0.5'>
                  {i.ejemplos.map((e) => (
                    <li key={e} className='truncate font-mono text-[11px] text-muted-foreground' title={e}>
                      · {e}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
        {!visibles.length ? <li className='text-sm text-emerald-700'>Todo en orden.</li> : null}
      </ul>
      <button type='button' className='text-xs font-medium text-muted-foreground underline' onClick={() => setVerOk((v) => !v)}>
        {verOk ? 'Ocultar comprobaciones correctas' : `Ver comprobaciones correctas (${r.items.filter((i) => i.nivel === 'ok').length})`}
      </button>

      <div className='space-y-2 border-t border-border pt-3'>
        <div className='flex items-center justify-between gap-2'>
          <p className='text-sm font-medium'>Enlaces</p>
          <Buttons type='button' size='sm' variant='outline' loading={verificando} disabled={!r.enlacesVerificables.length} onClick={() => void verificar()}>
            <HiOutlineLink className='h-4 w-4' /> Verificar {r.enlacesVerificables.length || ''}
          </Buttons>
        </div>
        {!r.enlacesVerificables.length ? <p className='text-xs text-muted-foreground'>No hay enlaces http(s) fijos para verificar.</p> : null}
        {enlaces ? (
          <>
            <p className={`text-xs ${rotos ? 'text-destructive' : 'text-muted-foreground'}`}>{rotos ? `${rotos} enlace(s) con problemas` : 'Ningún enlace roto'}</p>
            <ul className='max-h-56 space-y-1 overflow-y-auto text-xs'>
              {enlaces.map((e) => (
                <li key={e.url} className='flex items-start justify-between gap-2'>
                  <span className='min-w-0 truncate font-mono' title={e.mensaje ? `${e.url}\n${e.mensaje}` : e.url}>
                    {e.url}
                  </span>
                  <span className={`shrink-0 font-semibold ${ENLACE[e.resultado]?.clase ?? ''}`} title={e.mensaje ?? undefined}>
                    {ENLACE[e.resultado]?.texto ?? e.resultado}
                    {e.status ? ` ${e.status}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
