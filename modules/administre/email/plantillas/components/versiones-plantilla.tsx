/** @format */

'use client';

import { useState, type ReactNode } from 'react';
import Swal from 'sweetalert2';
import { Link, useRouter } from '@/shared/i18n/routing';
import {
  HiCheck,
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowsRightLeft,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheckBadge,
  HiOutlineEye,
  HiOutlinePaperAirplane,
  HiOutlinePencilSquare,
  HiOutlineRocketLaunch,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Modal } from '@repo/ui/modals/scenes';
import {
  comentarPlantillaEmailServerAction,
  flujoPlantillaEmailServerAction,
  restaurarVersionPlantillaEmailServerAction,
  versionPlantillaEmailServerAction,
} from '@/app/[locale]/(protected)/administre/email/plantillas/actions';
import { ejecutarAccion } from '../../shared/utils/feedback';
import type { AccionFlujo, AccionHistorial, EstadoAprobacion, IPlantilla, IPlantillaHistorial, IPlantillaVersion } from '../models/plantilla.interface';
import { AprobacionBadge } from './aprobacion-badge';
import { CompararVersiones } from './comparar-versiones';
import { VistaHtml } from './vista-html';

const RUTA = '/administre/email/plantillas';
const fmt = (f?: string | null) =>
  f ? new Date(f).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }) : '—';

const ACCIONES: Record<AccionHistorial, { texto: string; color: string }> = {
  CREADA: { texto: 'creó la plantilla', color: 'bg-slate-500' },
  EDITADA: { texto: 'guardó una nueva versión', color: 'bg-slate-500' },
  ENVIADA_REVISION: { texto: 'envió a revisión', color: 'bg-amber-500' },
  APROBADA: { texto: 'aprobó', color: 'bg-sky-600' },
  RECHAZADA: { texto: 'rechazó', color: 'bg-destructive' },
  PUBLICADA: { texto: 'publicó', color: 'bg-emerald-600' },
  RESTAURADA: { texto: 'restauró una versión anterior', color: 'bg-violet-600' },
  ACTIVADA: { texto: 'activó la plantilla', color: 'bg-emerald-600' },
  DESACTIVADA: { texto: 'desactivó la plantilla', color: 'bg-destructive' },
  COMENTARIO: { texto: 'comentó', color: 'bg-primary' },
};

/** Pasos del flujo; RECHAZADA vuelve al autor (BORRADOR). */
const PASOS: { estado: EstadoAprobacion; titulo: string }[] = [
  { estado: 'BORRADOR', titulo: 'Borrador' },
  { estado: 'EN_REVISION', titulo: 'En revisión' },
  { estado: 'APROBADA', titulo: 'Aprobada' },
  { estado: 'PUBLICADA', titulo: 'Publicada' },
];

const MENSAJES: Record<AccionFlujo, { titulo: string; exito: string; boton: string; comentario: 'opcional' | 'obligatorio' }> = {
  'enviar-revision': { titulo: 'Enviar a revisión', exito: 'Enviada a revisión', boton: 'Enviar', comentario: 'opcional' },
  aprobar: { titulo: 'Aprobar versión', exito: 'Versión aprobada', boton: 'Aprobar', comentario: 'opcional' },
  rechazar: { titulo: 'Rechazar versión', exito: 'Versión rechazada', boton: 'Rechazar', comentario: 'obligatorio' },
  publicar: { titulo: 'Publicar versión', exito: 'Versión publicada: los envíos ya usan esta versión', boton: 'Publicar', comentario: 'opcional' },
};

async function pedirComentario(titulo: string, texto: string, obligatorio: boolean, boton: string): Promise<string | null> {
  const r = await Swal.fire({
    title: titulo,
    text: texto,
    input: 'textarea',
    inputPlaceholder: obligatorio ? 'Motivo (obligatorio)' : 'Comentario (opcional)',
    inputAttributes: { maxlength: '1000' },
    showCancelButton: true,
    confirmButtonText: boton,
    cancelButtonText: 'Cancelar',
    inputValidator: (v) => (obligatorio && !v?.trim() ? 'Escribe el motivo para que el autor pueda corregirlo' : null),
  });
  return r.isConfirmed ? String(r.value ?? '').trim() : null;
}

function Tarjeta({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className='rounded-2xl border border-border bg-card p-4 sm:p-5'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-base font-semibold text-foreground'>{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

/**
 * Versiones y aprobación de una plantilla: estado del flujo con sus acciones, versiones (ver, comparar,
 * restaurar) e historial con comentarios. Solo la versión PUBLICADA se envía.
 */
export function VersionesPlantilla({ plantilla, versiones, historial }: { plantilla: IPlantilla; versiones: IPlantillaVersion[]; historial: IPlantillaHistorial[] }) {
  const router = useRouter();
  const [procesando, setProcesando] = useState<string | null>(null);
  const [viendo, setViendo] = useState<IPlantillaVersion | 'cargando' | null>(null);
  const [comparar, setComparar] = useState<{ a: number; b: number } | null>(null);
  const [comentario, setComentario] = useState('');

  const actual = versiones.find((v) => v.version === plantilla.version);
  const estado: EstadoAprobacion = actual?.estado ?? plantilla.estado_aprobacion ?? 'BORRADOR';
  const publicada = plantilla.version_publicada ?? null;
  const pasoActual = estado === 'RECHAZADA' ? 0 : PASOS.findIndex((p) => p.estado === estado);

  const ejecutar = async (accion: AccionFlujo) => {
    const m = MENSAJES[accion];
    const texto =
      accion === 'publicar'
        ? `La versión ${plantilla.version} reemplazará a la ${publicada ? `v${publicada}` : 'actual'} en todos los envíos nuevos.`
        : `Versión ${plantilla.version} de ${plantilla.codigo}.`;
    const c = await pedirComentario(m.titulo, texto, m.comentario === 'obligatorio', m.boton);
    if (c === null) return;
    setProcesando(accion);
    const ok = await ejecutarAccion(() => flujoPlantillaEmailServerAction(plantilla.codigo, accion, { comentario: c || null, version: plantilla.version }), {
      exito: m.exito,
      error: `No se pudo ${m.boton.toLowerCase()}.`,
    });
    setProcesando(null);
    if (ok) router.refresh();
  };

  const restaurar = async (v: IPlantillaVersion) => {
    const c = await pedirComentario(
      `Restaurar la versión ${v.version}`,
      `Se crea la versión ${plantilla.version + 1} (borrador) con el contenido de la v${v.version}. Tendrá que aprobarse y publicarse.`,
      false,
      'Restaurar',
    );
    if (c === null) return;
    setProcesando(`restaurar-${v.version}`);
    const ok = await ejecutarAccion(() => restaurarVersionPlantillaEmailServerAction(plantilla.codigo, v.version, { comentario: c || null, version: plantilla.version }), {
      exito: `Versión ${v.version} restaurada como borrador`,
      error: 'No se pudo restaurar la versión.',
    });
    setProcesando(null);
    if (ok) router.refresh();
  };

  const ver = async (v: IPlantillaVersion) => {
    setViendo('cargando');
    const r = await ejecutarAccion(() => versionPlantillaEmailServerAction(plantilla.codigo, v.version), { error: 'No se pudo cargar la versión.' });
    setViendo(r);
  };

  const comentar = async () => {
    if (!comentario.trim()) return;
    setProcesando('comentar');
    const ok = await ejecutarAccion(() => comentarPlantillaEmailServerAction(plantilla.codigo, { comentario: comentario.trim(), version: plantilla.version }), {
      error: 'No se pudo guardar el comentario.',
    });
    setProcesando(null);
    if (ok !== null) {
      setComentario('');
      router.refresh();
    }
  };

  const botones: { accion: AccionFlujo; icono: ReactNode; variante?: 'outline' }[] =
    estado === 'BORRADOR' || estado === 'RECHAZADA'
      ? [{ accion: 'enviar-revision', icono: <HiOutlinePaperAirplane className='h-4 w-4' /> }]
      : estado === 'EN_REVISION'
        ? [
            { accion: 'aprobar', icono: <HiOutlineCheckBadge className='h-4 w-4' /> },
            { accion: 'rechazar', icono: <HiOutlineXCircle className='h-4 w-4' />, variante: 'outline' },
          ]
        : estado === 'APROBADA'
          ? [
              { accion: 'publicar', icono: <HiOutlineRocketLaunch className='h-4 w-4' /> },
              { accion: 'rechazar', icono: <HiOutlineXCircle className='h-4 w-4' />, variante: 'outline' },
            ]
          : [];

  const ultimoRechazo = estado === 'RECHAZADA' ? historial.find((h) => h.accion === 'RECHAZADA' && h.version === plantilla.version) : undefined;
  const otraParaComparar = publicada && publicada !== plantilla.version ? publicada : versiones.find((v) => v.version < plantilla.version)?.version;

  return (
    <section className='mx-auto w-full max-w-[1400px] space-y-6'>
      <Link href={RUTA} className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'>
        <HiOutlineArrowLeft className='h-4 w-4' /> Volver a plantillas
      </Link>
      <header className='flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5'>
        <div className='space-y-2'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>Administración Email / Plantillas / Versiones</p>
          <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{plantilla.nombre}</h1>
          <p className='text-sm text-muted-foreground'>
            Código {plantilla.codigo} · Versión actual v{plantilla.version} ·{' '}
            {publicada ? (
              <>
                se envía la <strong className='text-foreground'>v{publicada}</strong>
              </>
            ) : (
              <strong className='text-destructive'>sin versión publicada (los envíos fallan)</strong>
            )}
          </p>
        </div>
        <Link
          href={`${RUTA}/${encodeURIComponent(plantilla.codigo)}/editar`}
          className='inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted'>
          <HiOutlinePencilSquare className='h-4 w-4' /> Editar (crea nueva versión)
        </Link>
      </header>

      <Tarjeta titulo='Flujo de aprobación' accion={<AprobacionBadge estado={estado} />}>
        <ol className='mb-5 grid grid-cols-4 gap-2'>
          {PASOS.map((p, i) => {
            const hecho = i < pasoActual || (estado === 'PUBLICADA' && i === pasoActual);
            const activo = i === pasoActual && estado !== 'PUBLICADA';
            return (
              <li key={p.estado} className='flex flex-col items-center gap-1.5 text-center'>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${hecho ? 'border-emerald-600 bg-emerald-600 text-white' : activo ? (estado === 'RECHAZADA' ? 'border-destructive text-destructive' : 'border-primary text-primary') : 'border-border text-muted-foreground'}`}>
                  {hecho ? <HiCheck className='h-4 w-4' /> : i + 1}
                </span>
                <span className={`text-xs ${activo || hecho ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {i === 0 && estado === 'RECHAZADA' ? 'Rechazada — corregir' : p.titulo}
                </span>
              </li>
            );
          })}
        </ol>
        {ultimoRechazo?.comentario ? (
          <div className='mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm'>
            <p className='font-semibold text-destructive'>Motivo del rechazo ({ultimoRechazo.actor_nombre ?? 'revisor'})</p>
            <p className='whitespace-pre-wrap'>{ultimoRechazo.comentario}</p>
            <p className='mt-1 text-xs text-muted-foreground'>Edita la plantilla para corregir o vuelve a enviarla a revisión.</p>
          </div>
        ) : null}
        <div className='flex flex-wrap items-center gap-2'>
          {botones.map((b) => (
            <Buttons key={b.accion} variant={b.variante} loading={procesando === b.accion} disabled={procesando !== null} onClick={() => void ejecutar(b.accion)}>
              {b.icono} {MENSAJES[b.accion].titulo}
            </Buttons>
          ))}
          {estado === 'PUBLICADA' ? <p className='text-sm text-muted-foreground'>La versión actual está publicada. Edita la plantilla para preparar una nueva versión.</p> : null}
          {estado === 'EN_REVISION' ? <p className='text-xs text-muted-foreground'>Quien creó la versión no puede aprobarla.</p> : null}
        </div>
      </Tarjeta>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]'>
        <Tarjeta
          titulo={`Versiones (${versiones.length})`}
          accion={
            otraParaComparar ? (
              <Buttons size='sm' variant='outline' onClick={() => setComparar({ a: otraParaComparar, b: plantilla.version })}>
                <HiOutlineArrowsRightLeft className='h-4 w-4' /> Comparar
              </Buttons>
            ) : null
          }>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[720px] text-sm'>
              <thead className='text-left text-xs uppercase tracking-wider text-muted-foreground'>
                <tr className='border-b border-border'>
                  <th className='py-2 pr-3'>Versión</th>
                  <th className='py-2 pr-3'>Estado</th>
                  <th className='py-2 pr-3'>Autor</th>
                  <th className='py-2 pr-3'>Revisión / publicación</th>
                  <th className='py-2 pr-3'>Nota</th>
                  <th className='py-2 text-right'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {versiones.map((v) => (
                  <tr key={v.version} className={`border-b border-border/60 align-top ${v.version === publicada ? 'bg-emerald-500/5' : ''}`}>
                    <td className='whitespace-nowrap py-2.5 pr-3 font-semibold tabular-nums'>
                      v{v.version}
                      {v.version === publicada ? <span className='ml-1.5 text-[10px] font-semibold uppercase text-emerald-700'>en uso</span> : null}
                    </td>
                    <td className='py-2.5 pr-3'>
                      <AprobacionBadge estado={v.estado} />
                    </td>
                    <td className='py-2.5 pr-3'>
                      <p>{v.autor_nombre ?? '—'}</p>
                      <p className='text-xs text-muted-foreground'>{fmt(v.created_at)}</p>
                    </td>
                    <td className='py-2.5 pr-3 text-xs text-muted-foreground'>
                      {v.revisado_por_nombre ? (
                        <p>
                          Revisó <span className='text-foreground'>{v.revisado_por_nombre}</span> · {fmt(v.revisado_at)}
                        </p>
                      ) : null}
                      {v.publicado_por_nombre ? (
                        <p>
                          Publicó <span className='text-foreground'>{v.publicado_por_nombre}</span> · {fmt(v.publicado_at)}
                        </p>
                      ) : null}
                      {!v.revisado_por_nombre && !v.publicado_por_nombre ? '—' : null}
                    </td>
                    <td className='max-w-[220px] py-2.5 pr-3 text-xs'>{v.comentario ?? <span className='text-muted-foreground'>—</span>}</td>
                    <td className='py-2.5'>
                      <div className='flex justify-end gap-1.5'>
                        <Buttons size='sm' variant='ghost' title='Ver versión' onClick={() => void ver(v)}>
                          <HiOutlineEye className='h-4 w-4' />
                        </Buttons>
                        {v.version !== plantilla.version ? (
                          <>
                            <Buttons size='sm' variant='ghost' title='Comparar con la versión actual' onClick={() => setComparar({ a: v.version, b: plantilla.version })}>
                              <HiOutlineArrowsRightLeft className='h-4 w-4' />
                            </Buttons>
                            <Buttons
                              size='sm'
                              variant='ghost'
                              title='Restaurar como nueva versión'
                              loading={procesando === `restaurar-${v.version}`}
                              disabled={procesando !== null}
                              onClick={() => void restaurar(v)}>
                              <HiOutlineArrowPath className='h-4 w-4' />
                            </Buttons>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <Tarjeta titulo='Historial y comentarios'>
          <div className='mb-4 space-y-2'>
            <label htmlFor='nuevo-comentario' className='sr-only'>
              Comentario
            </label>
            <textarea
              id='nuevo-comentario'
              rows={2}
              maxLength={1000}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={`Comentar la v${plantilla.version}…`}
              className='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            />
            <Buttons size='sm' variant='outline' loading={procesando === 'comentar'} disabled={!comentario.trim() || procesando !== null} onClick={() => void comentar()}>
              <HiOutlineChatBubbleLeftEllipsis className='h-4 w-4' /> Comentar
            </Buttons>
          </div>
          {historial.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Sin eventos todavía.</p>
          ) : (
            <div className='max-h-[640px] overflow-y-auto pl-2'>
            <ol className='relative space-y-4 border-l border-border pl-5'>
              {historial.map((h, i) => {
                const a = ACCIONES[h.accion] ?? { texto: h.accion.toLowerCase(), color: 'bg-slate-500' };
                return (
                  <li key={i} className='relative'>
                    <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-card ${a.color}`} />
                    <p className='text-sm'>
                      <strong>{h.actor_nombre ?? 'Sistema'}</strong> {a.texto}
                      {h.version ? <span className='text-muted-foreground'> · v{h.version}</span> : null}
                    </p>
                    {h.comentario ? <p className='mt-1 whitespace-pre-wrap rounded-lg bg-muted/50 px-3 py-2 text-sm'>{h.comentario}</p> : null}
                    <p className='mt-0.5 text-[11px] text-muted-foreground'>{fmt(h.fecha)}</p>
                  </li>
                );
              })}
            </ol>
            </div>
          )}
        </Tarjeta>
      </div>

      <Modal
        size='xl'
        title={viendo && viendo !== 'cargando' ? `Versión ${viendo.version}` : 'Versión'}
        open={viendo !== null}
        onOpenChange={(o) => !o && setViendo(null)}
        hideDefaultFooter>
        {viendo === 'cargando' ? (
          <p className='text-sm text-muted-foreground'>Cargando…</p>
        ) : viendo ? (
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <AprobacionBadge estado={viendo.estado} />
              <span className='text-xs text-muted-foreground'>
                {viendo.autor_nombre ?? '—'} · {fmt(viendo.created_at)}
              </span>
            </div>
            <p className='rounded-lg bg-muted/50 px-3 py-2 text-sm'>
              <span className='text-xs uppercase tracking-wider text-muted-foreground'>Asunto </span>
              {viendo.asunto}
            </p>
            <VistaHtml html={viendo.cuerpo_html ?? ''} alto={560} titulo={`Versión ${viendo.version}`} />
            {viendo.variables?.length ? (
              <p className='text-xs text-muted-foreground'>
                Variables: {viendo.variables.map((v) => `${v.nombre}${v.obligatoria === false ? ' (opcional)' : ''}`).join(', ')}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
      <Modal size='xl' title='Comparar versiones' open={comparar !== null} onOpenChange={(o) => !o && setComparar(null)} hideDefaultFooter>
        {comparar ? <CompararVersiones codigo={plantilla.codigo} versiones={versiones} inicialA={comparar.a} inicialB={comparar.b} /> : null}
      </Modal>
    </section>
  );
}
