/** @format */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { HiOutlineArchiveBox, HiOutlineArrowUturnLeft, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineSwatch, HiOutlineTrash } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { Modal } from '@repo/ui/modals/scenes';
import {
  actualizarComponenteEmailServerAction,
  archivarComponenteEmailServerAction,
  guardarMarcaEmailServerAction,
  listarComponentesEmailServerAction,
} from '@/app/[locale]/(protected)/administre/email/marca/actions';
import type { CategoriaComponente, IComponente, IGuardarMarca, IMarca } from '@/server/domains/administre/email/disenos/types';
import { ManagerHeader } from '../../shared/components/manager-header';
import { confirmar, ejecutarAccion } from '../../shared/utils/feedback';
import { fechaCorta } from '../../shared/utils/formato';
import { FUENTES, REDES, type RedSocial } from '../../plantillas/editor/models/diseno';
import { ajustesDeMarca, redesDeMarca } from '../../plantillas/editor/models/marca';
import { generarHtml } from '../../plantillas/editor/utils/generar-html';
import { SECCIONES } from '../../plantillas/editor/utils/secciones';
import { CATEGORIAS_COMPONENTE } from '../../plantillas/editor/components/biblioteca';
import { VistaDispositivos } from '../../plantillas/editor/components/editor-visual';

const COLOR = /^#[0-9a-fA-F]{6}$/;
const URL_HTTPS = /^https:\/\/\S+$/;
const URL_HTTP = /^https?:\/\/\S+$/;
const claseInput = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Secciones con las que se muestra la marca en la vista previa. */
const MUESTRA = ['enc-logo', 'ban-hero', 'con-saludo', 'dat-detalle', 'acc-boton', 'pie-completo'];

type Campo = keyof IGuardarMarca;

function Etiqueta({ texto, error, children, ayuda }: { texto: string; error?: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className='block space-y-1.5'>
      <span className='text-sm font-medium text-foreground'>{texto}</span>
      {children}
      {error ? <span className='block text-xs text-destructive'>{error}</span> : ayuda ? <span className='block text-xs text-muted-foreground'>{ayuda}</span> : null}
    </label>
  );
}

function Color({ etiqueta, valor, onChange, error }: { etiqueta: string; valor: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Etiqueta texto={etiqueta} error={error}>
      <span className='flex gap-2'>
        <input type='color' aria-label={`${etiqueta} (selector)`} value={COLOR.test(valor) ? valor : '#000000'} onChange={(e) => onChange(e.target.value)} className='h-10 w-12 cursor-pointer rounded-lg border border-input bg-background p-1' />
        <input value={valor} onChange={(e) => onChange(e.target.value.trim())} className={`${claseInput} font-mono`} aria-label={`${etiqueta} (hex)`} />
      </span>
    </Etiqueta>
  );
}

/** Errores de validación (mismas reglas que email_gateway). */
function validar(v: IGuardarMarca): Partial<Record<Campo, string>> {
  const e: Partial<Record<Campo, string>> = {};
  if (!v.nombre_empresa.trim()) e.nombre_empresa = 'Obligatorio';
  if (v.logo_url && !URL_HTTPS.test(v.logo_url)) e.logo_url = 'Debe ser una URL https';
  if (v.sitio_web && !URL_HTTP.test(v.sitio_web)) e.sitio_web = 'Debe ser una URL http(s)';
  for (const k of ['color_primario', 'color_secundario', 'color_texto', 'color_fondo', 'color_fondo_exterior'] as const) {
    if (!COLOR.test(v[k])) e[k] = 'Color #RRGGBB';
  }
  if (redesDeMarca(v).length !== JSON.parse(v.redes_json || '[]').length) e.redes_json = 'Revisa las URL de las redes (deben iniciar con http)';
  return e;
}

/**
 * Marca corporativa (logo, colores, fuente, contacto, redes y pie legal) con vista previa en vivo, y administración
 * de los componentes guardados de la biblioteca del editor.
 */
export function MarcaEmailManager({ marca, componentes }: { marca: IMarca; componentes: IComponente[] }) {
  const [v, setV] = useState<IGuardarMarca>(() => ({
    nombre_empresa: marca.nombre_empresa,
    logo_url: marca.logo_url ?? '',
    logo_ancho: marca.logo_ancho ?? 160,
    color_primario: marca.color_primario,
    color_secundario: marca.color_secundario,
    color_texto: marca.color_texto,
    color_fondo: marca.color_fondo,
    color_fondo_exterior: marca.color_fondo_exterior,
    fuente: marca.fuente,
    direccion: marca.direccion ?? '',
    sitio_web: marca.sitio_web ?? '',
    telefono: marca.telefono ?? '',
    email_contacto: marca.email_contacto ?? '',
    pie_legal: marca.pie_legal ?? '',
    redes_json: marca.redes_json || '[]',
  }));
  const [guardando, setGuardando] = useState(false);
  const [tocado, setTocado] = useState(false);
  const set = (k: Campo) => (valor: string | number) => {
    setTocado(true);
    setV((p) => ({ ...p, [k]: valor }));
  };
  const redes = useMemo(() => {
    try {
      return JSON.parse(v.redes_json || '[]') as { red: string; url: string }[];
    } catch {
      return [];
    }
  }, [v.redes_json]);
  const setRedes = (lista: { red: string; url: string }[]) => set('redes_json')(JSON.stringify(lista));
  const errores = validar(v);
  const hayErrores = Object.keys(errores).length > 0;

  // Vista previa: secciones de muestra con la marca (en el navegador; el generador usa DOM)
  const [html, setHtml] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => {
      const bloques = MUESTRA.flatMap((id) => SECCIONES.find((s) => s.id === id)?.crear(v) ?? []);
      setHtml(generarHtml({ version: 1, ajustes: ajustesDeMarca(v), bloques }));
    }, 250);
    return () => window.clearTimeout(t);
  }, [v]);

  const guardar = async () => {
    if (hayErrores) return;
    setGuardando(true);
    const payload: IGuardarMarca = {
      ...v,
      nombre_empresa: v.nombre_empresa.trim(),
      logo_url: v.logo_url?.trim() || null,
      direccion: v.direccion?.trim() || null,
      sitio_web: v.sitio_web?.trim() || null,
      telefono: v.telefono?.trim() || null,
      email_contacto: v.email_contacto?.trim() || null,
      pie_legal: v.pie_legal?.trim() || null,
    };
    const ok = await ejecutarAccion(() => guardarMarcaEmailServerAction(payload), { exito: 'Marca guardada', error: 'No se pudo guardar la marca.' });
    setGuardando(false);
    if (ok) setTocado(false);
  };

  return (
    <section className='flex flex-col gap-8'>
      <ManagerHeader
        icon={<HiOutlineSwatch className='h-6 w-6' />}
        title='Marca y componentes'
        description='La identidad que usan las secciones prediseñadas del editor de plantillas y el botón "Aplicar marca". Los componentes guardados se reutilizan en cualquier plantilla.'
      />

      <div className='grid gap-6 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]'>
        <div className='space-y-6'>
          <section className='space-y-4 rounded-2xl border border-border bg-card p-5'>
            <h2 className='font-semibold text-foreground'>Identidad</h2>
            <Etiqueta texto='Nombre de la empresa' error={errores.nombre_empresa}>
              <input className={claseInput} value={v.nombre_empresa} maxLength={150} onChange={(e) => set('nombre_empresa')(e.target.value)} />
            </Etiqueta>
            <Etiqueta texto='Logo (URL https)' error={tocado ? errores.logo_url : undefined} ayuda='PNG o SVG publicado en un servidor; sin logo se usa el nombre de la empresa.'>
              <input className={claseInput} value={v.logo_url ?? ''} placeholder='https://…/logo.png' onChange={(e) => set('logo_url')(e.target.value)} />
            </Etiqueta>
            <Etiqueta texto={`Ancho del logo: ${v.logo_ancho ?? 160}px`}>
              <input type='range' min={40} max={400} step={10} value={v.logo_ancho ?? 160} onChange={(e) => set('logo_ancho')(Number(e.target.value))} className='w-full accent-primary' />
            </Etiqueta>
            <Etiqueta texto='Fuente'>
              <select className={claseInput} value={v.fuente} onChange={(e) => set('fuente')(e.target.value)}>
                {FUENTES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Etiqueta>
          </section>

          <section className='space-y-4 rounded-2xl border border-border bg-card p-5'>
            <h2 className='font-semibold text-foreground'>Colores</h2>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Color etiqueta='Principal (encabezados, banners)' valor={v.color_primario} onChange={set('color_primario')} error={errores.color_primario} />
              <Color etiqueta='Secundario (botones, enlaces)' valor={v.color_secundario} onChange={set('color_secundario')} error={errores.color_secundario} />
              <Color etiqueta='Texto' valor={v.color_texto} onChange={set('color_texto')} error={errores.color_texto} />
              <Color etiqueta='Fondo del correo' valor={v.color_fondo} onChange={set('color_fondo')} error={errores.color_fondo} />
              <Color etiqueta='Fondo exterior' valor={v.color_fondo_exterior} onChange={set('color_fondo_exterior')} error={errores.color_fondo_exterior} />
            </div>
          </section>

          <section className='space-y-4 rounded-2xl border border-border bg-card p-5'>
            <h2 className='font-semibold text-foreground'>Contacto y pie de página</h2>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Etiqueta texto='Dirección'>
                <input className={claseInput} value={v.direccion ?? ''} maxLength={300} onChange={(e) => set('direccion')(e.target.value)} />
              </Etiqueta>
              <Etiqueta texto='Teléfono'>
                <input className={claseInput} value={v.telefono ?? ''} maxLength={60} onChange={(e) => set('telefono')(e.target.value)} />
              </Etiqueta>
              <Etiqueta texto='Email de contacto'>
                <input className={claseInput} type='email' value={v.email_contacto ?? ''} maxLength={200} onChange={(e) => set('email_contacto')(e.target.value)} />
              </Etiqueta>
              <Etiqueta texto='Sitio web' error={tocado ? errores.sitio_web : undefined}>
                <input className={claseInput} value={v.sitio_web ?? ''} placeholder='https://' onChange={(e) => set('sitio_web')(e.target.value)} />
              </Etiqueta>
            </div>
            <Etiqueta texto='Texto legal' ayuda='Se agrega al pie corporativo (admite <b>, <i> y enlaces).'>
              <textarea rows={3} className='w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring' value={v.pie_legal ?? ''} maxLength={5000} onChange={(e) => set('pie_legal')(e.target.value)} />
            </Etiqueta>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-foreground'>Redes sociales</p>
              {redes.map((r, i) => (
                <div key={i} className='flex gap-2'>
                  <select aria-label={`Red ${i + 1}`} value={r.red} onChange={(e) => setRedes(redes.map((x, j) => (j === i ? { ...x, red: e.target.value } : x)))} className='h-10 w-40 rounded-lg border border-input bg-background px-2 text-sm'>
                    {(Object.keys(REDES) as RedSocial[]).map((k) => (
                      <option key={k} value={k}>
                        {REDES[k].nombre}
                      </option>
                    ))}
                  </select>
                  <input aria-label={`URL de la red ${i + 1}`} className={claseInput} value={r.url} placeholder='https://' onChange={(e) => setRedes(redes.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                  <button type='button' aria-label='Quitar red' onClick={() => setRedes(redes.filter((_, j) => j !== i))} className='rounded-lg px-2 text-destructive hover:bg-destructive/10'>
                    <HiOutlineTrash className='h-4 w-4' />
                  </button>
                </div>
              ))}
              {errores.redes_json && tocado ? <p className='text-xs text-destructive'>{errores.redes_json}</p> : null}
              <Buttons type='button' size='sm' variant='outline' onClick={() => setRedes([...redes, { red: 'facebook', url: 'https://' }])}>
                <HiOutlinePlus className='h-4 w-4' /> Agregar red
              </Buttons>
            </div>
          </section>

          <div className='sticky bottom-0 z-10 flex items-center justify-between gap-2 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur'>
            <span className='text-xs text-muted-foreground'>{marca.id ? `Última actualización: ${fechaCorta(marca.updated_at ?? marca.created_at)}` : 'Aún no se ha guardado: se usan valores por defecto.'}</span>
            <Buttons type='button' loading={guardando} disabled={hayErrores} onClick={() => void guardar()}>
              Guardar marca
            </Buttons>
          </div>
        </div>

        <div className='space-y-2 xl:sticky xl:top-4 xl:self-start'>
          <h2 className='font-semibold text-foreground'>Vista previa</h2>
          <p className='text-xs text-muted-foreground'>Así se ven las secciones prediseñadas con tu marca. Las plantillas existentes no cambian: usa "Aplicar marca" en el editor.</p>
          <VistaDispositivos html={html || '<p style="font-family:sans-serif;color:#888;padding:24px">Generando…</p>'} alto={720} />
        </div>
      </div>

      <ComponentesGuardados inicial={componentes} />
    </section>
  );
}

/** Administración de los componentes de la biblioteca: renombrar, recategorizar, archivar y restaurar. */
function ComponentesGuardados({ inicial }: { inicial: IComponente[] }) {
  const [lista, setLista] = useState(inicial);
  const [editando, setEditando] = useState<IComponente | null>(null);
  const [form, setForm] = useState({ nombre: '', categoria: 'CONTENIDO' as CategoriaComponente, descripcion: '' });
  const [verArchivados, setVerArchivados] = useState(false);

  const recargar = async () => {
    const r = await listarComponentesEmailServerAction(true);
    if (r.success) setLista(r.data);
  };

  const estado = async (c: IComponente, eliminado: boolean) => {
    if (eliminado && !(await confirmar(`¿Archivar "${c.nombre}"?`, 'Deja de aparecer en la biblioteca del editor. Las plantillas que ya lo usan no cambian.'))) return;
    const ok = await ejecutarAccion(() => archivarComponenteEmailServerAction(c.id, eliminado), {
      exito: eliminado ? 'Componente archivado' : 'Componente restaurado',
      error: 'No se pudo cambiar el estado.',
    });
    if (ok) void recargar();
  };

  const guardar = async () => {
    if (!editando || !form.nombre.trim()) return;
    const ok = await ejecutarAccion(
      () =>
        actualizarComponenteEmailServerAction(editando.id, {
          nombre: form.nombre.trim(),
          categoria: form.categoria,
          descripcion: form.descripcion.trim() || null,
          contenido_json: editando.contenido_json,
        }),
      { exito: 'Componente actualizado', error: 'No se pudo actualizar.' },
    );
    if (ok) {
      setEditando(null);
      void recargar();
    }
  };

  const visibles = lista.filter((c) => verArchivados || !c.eliminado);
  const etiquetaCat = (c: string) => CATEGORIAS_COMPONENTE.find((x) => x.value === c)?.label ?? c;

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-xl font-semibold tracking-tight text-foreground'>Componentes guardados</h2>
          <p className='text-sm text-muted-foreground'>Se crean desde el editor: selecciona un bloque y usa el ícono de marcador "Guardar como componente".</p>
        </div>
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          <input type='checkbox' className='h-4 w-4 accent-primary' checked={verArchivados} onChange={(e) => setVerArchivados(e.target.checked)} />
          Ver archivados
        </label>
      </div>
      {visibles.length ? (
        <div className='overflow-x-auto rounded-2xl border border-border'>
          <table className='w-full min-w-[720px] text-sm'>
            <thead className='bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground'>
              <tr>
                <th className='px-4 py-3'>Componente</th>
                <th className='px-4 py-3'>Categoría</th>
                <th className='px-4 py-3'>Actualizado</th>
                <th className='px-4 py-3'>Estado</th>
                <th className='px-4 py-3'>Acciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {visibles.map((c) => (
                <tr key={c.id} className='hover:bg-muted/20'>
                  <td className='px-4 py-3'>
                    <p className='font-medium text-foreground'>{c.nombre}</p>
                    {c.descripcion ? <p className='text-xs text-muted-foreground'>{c.descripcion}</p> : null}
                  </td>
                  <td className='px-4 py-3'>
                    <Badge variant='outline'>{etiquetaCat(c.categoria)}</Badge>
                  </td>
                  <td className='px-4 py-3 text-xs text-muted-foreground'>{fechaCorta(c.updated_at ?? c.created_at)}</td>
                  <td className='px-4 py-3'>{c.eliminado ? <Badge variant='secondary'>Archivado</Badge> : <Badge variant='default'>Activo</Badge>}</td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-2'>
                      <Buttons
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setEditando(c);
                          setForm({ nombre: c.nombre, categoria: c.categoria, descripcion: c.descripcion ?? '' });
                        }}>
                        <HiOutlinePencilSquare className='h-4 w-4' /> Editar
                      </Buttons>
                      {c.eliminado ? (
                        <Buttons size='sm' variant='ghost' onClick={() => void estado(c, false)}>
                          <HiOutlineArrowUturnLeft className='h-4 w-4' /> Restaurar
                        </Buttons>
                      ) : (
                        <Buttons size='sm' variant='ghost' className='text-destructive' onClick={() => void estado(c, true)}>
                          <HiOutlineArchiveBox className='h-4 w-4' /> Archivar
                        </Buttons>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className='rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground'>Aún no hay componentes guardados.</p>
      )}

      <Modal size='md' title='Editar componente' open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} hideDefaultFooter>
        <div className='space-y-4'>
          <Etiqueta texto='Nombre'>
            <input className={claseInput} value={form.nombre} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          </Etiqueta>
          <Etiqueta texto='Categoría'>
            <select className={claseInput} value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as CategoriaComponente }))}>
              {CATEGORIAS_COMPONENTE.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Etiqueta>
          <Etiqueta texto='Descripción'>
            <input className={claseInput} value={form.descripcion} maxLength={300} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
          </Etiqueta>
          <p className='text-xs text-muted-foreground'>Para cambiar el contenido: arrástralo a una plantilla, edítalo y guárdalo como un componente nuevo.</p>
          <div className='flex justify-end gap-2'>
            <Buttons type='button' variant='outline' onClick={() => setEditando(null)}>
              Cancelar
            </Buttons>
            <Buttons type='button' disabled={!form.nombre.trim()} onClick={() => void guardar()}>
              Guardar
            </Buttons>
          </div>
        </div>
      </Modal>
    </section>
  );
}
