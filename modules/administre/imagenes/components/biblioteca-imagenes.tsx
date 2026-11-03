/** @format */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import {
  HiCheck,
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineArrowUpTray,
  HiOutlineClipboardDocument,
  HiOutlineExclamationTriangle,
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineMagnifyingGlass,
  HiOutlinePhoto,
  HiOutlineTag,
  HiOutlineTrash,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Link } from '@/shared/i18n/routing';
import {
  actualizarImagenServerAction,
  buscarImagenesServerAction,
  carpetasImagenesServerAction,
  eliminarImagenServerAction,
  estadoImagenServerAction,
  etiquetasImagenesServerAction,
  moverImagenesServerAction,
  subirImagenServerAction,
  usosImagenServerAction,
} from '@/app/[locale]/(protected)/administre/email/imagenes/actions';
import type { EstadoImagen, IConteo, IImagen, IUsosImagen } from '@/server/domains/administre/imagenes/types';
import { confirmar, ejecutarAccion } from '../../email/shared/utils/feedback';
import { formatoBytes, optimizarImagen } from '../utils/optimizar';

/** Arrastre de una imagen de la biblioteca al editor de correo. */
export const MIME_IMAGEN = 'application/x-astra-imagen';

const TAM_PAGINA = 48;
/** Carpeta raíz en los filtros (el backend la normaliza a ""). */
const RAIZ = '/';
const claseInput =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

type EstadoCola = 'optimizando' | 'subiendo' | 'listo' | 'duplicada' | 'error';
interface ItemCola {
  id: string;
  nombre: string;
  estado: EstadoCola;
  mensaje?: string;
}

interface Props {
  /** administrar: página completa con detalle y acciones; seleccionar: elegir una imagen (modal o panel del editor). */
  modo: 'administrar' | 'seleccionar';
  onSeleccionar?: (imagen: IImagen) => void;
  /** Versión angosta para el panel lateral del editor. */
  compacto?: boolean;
  /** Permite arrastrar la imagen (al lienzo del editor); quien recibe marca el DataTransfer con su propio tipo. */
  onArrastrar?: (imagen: IImagen | null, dt?: DataTransfer) => void;
}

/**
 * Biblioteca de imágenes propias (S3 vía notificacion): subida múltiple con optimización en el navegador, carpetas,
 * etiquetas, búsqueda, detalle con URL pública, dónde se usa, archivar y borrar seguro.
 */
export function BibliotecaImagenes({ modo, onSeleccionar, compacto, onArrastrar }: Props) {
  const administrar = modo === 'administrar';
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [carpeta, setCarpeta] = useState<string | undefined>(undefined);
  const [etiqueta, setEtiqueta] = useState<string | undefined>(undefined);
  const [estado, setEstado] = useState<EstadoImagen>('ACTIVA');
  const [lista, setLista] = useState<IImagen[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carpetas, setCarpetas] = useState<IConteo[]>([]);
  const [etiquetas, setEtiquetas] = useState<IConteo[]>([]);
  const [detalle, setDetalle] = useState<IImagen | null>(null);
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const [cola, setCola] = useState<ItemCola[]>([]);
  const [soltando, setSoltando] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const consulta = useRef(0);

  // Búsqueda con pausa para no consultar en cada tecla
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const cargar = useCallback(
    async (pag = 0) => {
      const n = ++consulta.current;
      setCargando(true);
      setError(null);
      const r = await buscarImagenesServerAction({ q: busqueda || undefined, carpeta, etiqueta, estado, page: pag, size: TAM_PAGINA });
      if (n !== consulta.current) return; // llegó una consulta más nueva
      setCargando(false);
      if (!r.success) {
        setError(r.error);
        if (pag === 0) setLista([]);
        return;
      }
      setTotal(r.data.total);
      setPagina(pag);
      setLista((prev) => (pag === 0 ? r.data.contenido : [...(prev ?? []), ...r.data.contenido]));
    },
    [busqueda, carpeta, etiqueta, estado],
  );

  const cargarFiltros = useCallback(async () => {
    const [c, e] = await Promise.all([carpetasImagenesServerAction(estado), etiquetasImagenesServerAction(estado)]);
    if (c.success) setCarpetas(c.data);
    if (e.success) setEtiquetas(e.data);
  }, [estado]);

  useEffect(() => {
    void cargar(0);
  }, [cargar]);
  useEffect(() => {
    void cargarFiltros();
  }, [cargarFiltros]);
  useEffect(() => setMarcadas(new Set()), [busqueda, carpeta, etiqueta, estado]);

  const refrescar = () => {
    void cargar(0);
    void cargarFiltros();
  };

  /* ---------- Subida ---------- */
  const carpetaDestino = carpeta && carpeta !== RAIZ ? carpeta : '';
  const subir = async (files: FileList | File[]) => {
    const archivos = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!archivos.length) return;
    const items = archivos.map((f, i) => ({ id: `${Date.now()}-${i}`, nombre: f.name, estado: 'optimizando' as EstadoCola }));
    setCola((c) => [...items, ...c].slice(0, 30));
    const actualizar = (id: string, cambios: Partial<ItemCola>) => setCola((c) => c.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
    let ultima: IImagen | null = null;
    // De a una: el gateway y S3 no se saturan y el progreso se entiende
    for (let i = 0; i < archivos.length; i++) {
      const f = archivos[i]!;
      const item = items[i]!;
      try {
        const o = await optimizarImagen(f);
        actualizar(item.id, {
          estado: 'subiendo',
          mensaje: o.optimizada ? `${formatoBytes(o.bytesOriginal)} → ${formatoBytes(o.archivo.size)} · ${o.ancho}×${o.alto}` : `${formatoBytes(o.archivo.size)}`,
        });
        const form = new FormData();
        form.set('archivo', o.archivo, o.archivo.name);
        if (carpetaDestino) form.set('carpeta', carpetaDestino);
        if (etiqueta) form.set('etiquetas', etiqueta);
        const r = await subirImagenServerAction(form);
        if (!r.success) {
          actualizar(item.id, { estado: 'error', mensaje: r.error });
          continue;
        }
        ultima = r.data;
        actualizar(
          item.id,
          r.data.duplicada
            ? { estado: 'duplicada', mensaje: `Ya estaba en la biblioteca: "${r.data.nombre}"` }
            : { estado: 'listo', mensaje: `Lista · ${o.optimizada ? `${formatoBytes(o.bytesOriginal)} → ` : ''}${formatoBytes(r.data.bytes)} · ${r.data.ancho}×${r.data.alto}` },
        );
      } catch (e) {
        actualizar(item.id, { estado: 'error', mensaje: (e as Error).message });
      }
    }
    if (estado !== 'ACTIVA') setEstado('ACTIVA');
    else refrescar();
    if (ultima && administrar && archivos.length === 1) setDetalle(ultima);
  };

  const alSoltar = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setSoltando(false);
    void subir(e.dataTransfer.files);
  };

  /* ---------- Acciones en lote ---------- */
  const mover = async () => {
    const { default: Swal } = await import('sweetalert2');
    const r = await Swal.fire({
      title: `Mover ${marcadas.size} imagen(es)`,
      input: 'text',
      inputLabel: 'Carpeta destino (vacío = raíz; usa / para subcarpetas)',
      inputValue: carpetaDestino,
      showCancelButton: true,
      confirmButtonText: 'Mover',
      cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;
    const ok = await ejecutarAccion(() => moverImagenesServerAction([...marcadas], String(r.value ?? '')), { exito: 'Imágenes movidas', error: 'No se pudieron mover.' });
    if (ok) {
      setMarcadas(new Set());
      refrescar();
    }
  };

  const hayMas = lista !== null && lista.length < total;
  const nombreCarpeta = carpeta === undefined ? 'Todas las imágenes' : carpeta === RAIZ ? 'Sin carpeta' : carpeta;

  const filtros = (
    <div className={compacto ? 'space-y-2' : 'space-y-5'}>
      {compacto ? (
        <select
          aria-label='Carpeta'
          className={claseInput}
          value={carpeta ?? ''}
          onChange={(e) => setCarpeta(e.target.value === '' ? undefined : e.target.value)}>
          <option value=''>Todas las carpetas</option>
          <option value={RAIZ}>Sin carpeta</option>
          {carpetas.filter((c) => c.nombre).map((c) => (
            <option key={c.nombre} value={c.nombre}>
              {c.nombre} ({c.cantidad})
            </option>
          ))}
        </select>
      ) : (
        <div>
          <p className='mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Carpetas</p>
          <ul className='space-y-0.5 text-sm'>
            <ItemFiltro activo={carpeta === undefined} onClick={() => setCarpeta(undefined)} icono={<HiOutlinePhoto className='h-4 w-4' />} texto='Todas' />
            {carpetas.map((c) => (
              <ItemFiltro
                key={c.nombre || RAIZ}
                activo={carpeta === (c.nombre || RAIZ)}
                onClick={() => setCarpeta(c.nombre || RAIZ)}
                icono={carpeta === (c.nombre || RAIZ) ? <HiOutlineFolderOpen className='h-4 w-4' /> : <HiOutlineFolder className='h-4 w-4' />}
                texto={c.nombre || 'Sin carpeta'}
                cantidad={c.cantidad}
              />
            ))}
          </ul>
        </div>
      )}
      {etiquetas.length ? (
        <div>
          {!compacto ? <p className='mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Etiquetas</p> : null}
          <div className='flex flex-wrap gap-1'>
            {etiquetas.slice(0, compacto ? 12 : 40).map((t) => (
              <button
                key={t.nombre}
                type='button'
                onClick={() => setEtiqueta((x) => (x === t.nombre ? undefined : t.nombre))}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${etiqueta === t.nombre ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>
                <HiOutlineTag className='h-3 w-3' /> {t.nombre}
                {!compacto ? <span className='opacity-70'>{t.cantidad}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {administrar ? (
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          <input type='checkbox' className='h-4 w-4 accent-primary' checked={estado === 'ARCHIVADA'} onChange={(e) => setEstado(e.target.checked ? 'ARCHIVADA' : 'ACTIVA')} />
          Ver archivadas
        </label>
      ) : null}
    </div>
  );

  const barra = (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='relative min-w-0 flex-1'>
        <HiOutlineMagnifyingGlass className='pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <input
          type='search'
          aria-label='Buscar imágenes'
          className={`${claseInput} pl-8`}
          placeholder={compacto ? 'Buscar' : 'Buscar por nombre, texto alternativo o etiqueta'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <input
        ref={input}
        type='file'
        multiple
        accept='image/png,image/jpeg,image/gif,image/webp'
        className='hidden'
        onChange={(e) => {
          if (e.target.files) void subir(e.target.files);
          e.target.value = '';
        }}
      />
      <Buttons type='button' size='sm' onClick={() => input.current?.click()} title='Subir imágenes'>
        <HiOutlineArrowUpTray className='h-4 w-4' /> {compacto ? '' : 'Subir'}
      </Buttons>
      {!compacto ? (
        <Buttons type='button' size='sm' variant='outline' onClick={refrescar} title='Recargar'>
          <HiOutlineArrowPath className='h-4 w-4' />
        </Buttons>
      ) : null}
    </div>
  );

  const grilla = (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setSoltando(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSoltando(false);
      }}
      onDrop={alSoltar}
      className={`relative min-h-[220px] rounded-xl transition ${soltando ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {soltando ? (
        <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary'>
          Suelta para subir{carpetaDestino ? ` a "${carpetaDestino}"` : ''}
        </div>
      ) : null}
      {error ? <p className='mb-2 rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive'>{error}</p> : null}
      {lista === null ? <p className='text-sm text-muted-foreground'>Cargando imágenes…</p> : null}
      {lista !== null && !lista.length && !cargando && !error ? (
        <button
          type='button'
          onClick={() => input.current?.click()}
          className='flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground hover:border-primary/50'>
          <HiOutlineArrowUpTray className='h-8 w-8' />
          {busqueda || etiqueta || carpeta ? 'No hay imágenes con este filtro.' : 'Aún no hay imágenes.'}
          <span className='text-xs'>Arrastra archivos aquí o haz clic para subir (JPG, PNG o GIF; se optimizan para correo).</span>
        </button>
      ) : null}
      <div className={`grid gap-2 ${compacto ? 'grid-cols-2' : 'grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3'}`}>
        {(lista ?? []).map((img) => (
          <Tarjeta
            key={img.id}
            img={img}
            compacto={compacto}
            activa={detalle?.id === img.id}
            marcada={marcadas.has(img.id)}
            onMarcar={
              administrar
                ? () =>
                    setMarcadas((m) => {
                      const n = new Set(m);
                      if (n.has(img.id)) n.delete(img.id);
                      else n.add(img.id);
                      return n;
                    })
                : undefined
            }
            onClick={() => (administrar ? setDetalle(img) : onSeleccionar?.(img))}
            onArrastrar={onArrastrar}
          />
        ))}
      </div>
      {hayMas ? (
        <div className='mt-3 text-center'>
          <Buttons type='button' size='sm' variant='outline' loading={cargando} onClick={() => void cargar(pagina + 1)}>
            Cargar más ({total - (lista?.length ?? 0)})
          </Buttons>
        </div>
      ) : null}
    </div>
  );

  const colaVista = cola.length ? (
    <div className='rounded-xl border border-border bg-muted/30 p-2'>
      <div className='mb-1 flex items-center justify-between'>
        <p className='text-xs font-semibold'>Subidas</p>
        {cola.every((c) => c.estado !== 'optimizando' && c.estado !== 'subiendo') ? (
          <button type='button' className='text-[11px] text-muted-foreground underline' onClick={() => setCola([])}>
            Limpiar
          </button>
        ) : null}
      </div>
      <ul className='max-h-40 space-y-1 overflow-y-auto text-xs'>
        {cola.map((c) => (
          <li key={c.id} className='flex items-start gap-2'>
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                c.estado === 'listo' ? 'bg-emerald-600 text-white' : c.estado === 'duplicada' ? 'bg-sky-600 text-white' : c.estado === 'error' ? 'bg-destructive text-white' : 'animate-pulse bg-primary/40'
              }`}>
              {c.estado === 'listo' || c.estado === 'duplicada' ? <HiCheck className='h-3 w-3' /> : c.estado === 'error' ? <HiOutlineXMark className='h-3 w-3' /> : null}
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block truncate font-medium'>{c.nombre}</span>
              <span className={`block ${c.estado === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                {c.estado === 'optimizando' ? 'Optimizando…' : c.estado === 'subiendo' ? `Subiendo… ${c.mensaje ?? ''}` : c.mensaje ?? (c.estado === 'listo' ? 'Lista' : '')}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  if (compacto) {
    return (
      <div className='space-y-2'>
        {barra}
        {filtros}
        {colaVista}
        <p className='text-[11px] text-muted-foreground'>Haz clic para agregarla al correo o arrástrala a la posición que quieras.</p>
        {grilla}
      </div>
    );
  }

  return (
    <section className='space-y-4'>
      {administrar ? (
        <header className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-xl font-bold tracking-tight'>Biblioteca de imágenes</h2>
            <p className='max-w-3xl text-sm text-muted-foreground'>
              Logos, banners y fotos de la empresa para usar en los correos. Se optimizan al subirlas (máx. 1200 px) y quedan publicadas en una URL
              permanente. Solo se pueden borrar si ninguna plantilla, componente o marca las usa; si no, archívalas.
            </p>
          </div>
        </header>
      ) : null}
      <div className={`grid gap-4 ${administrar ? 'lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_340px]' : 'md:grid-cols-[200px_minmax(0,1fr)]'}`}>
        <aside className='rounded-2xl border border-border bg-card p-3'>{filtros}</aside>
        <div className='min-w-0 space-y-3 rounded-2xl border border-border bg-card p-3 sm:p-4'>
          {barra}
          <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
            <span>
              <strong className='text-foreground'>{nombreCarpeta}</strong>
              {etiqueta ? ` · #${etiqueta}` : ''}
              {estado === 'ARCHIVADA' ? ' · archivadas' : ''} · {total} imagen(es)
            </span>
            {administrar && marcadas.size ? (
              <span className='flex items-center gap-2'>
                {marcadas.size} seleccionada(s)
                <Buttons type='button' size='sm' variant='outline' onClick={() => void mover()}>
                  <HiOutlineFolder className='h-4 w-4' /> Mover a carpeta
                </Buttons>
                <button type='button' className='underline' onClick={() => setMarcadas(new Set())}>
                  Quitar selección
                </button>
              </span>
            ) : null}
          </div>
          {colaVista}
          {grilla}
        </div>
        {administrar ? (
          <aside className='rounded-2xl border border-border bg-card p-4 lg:col-span-2 xl:col-span-1'>
            {detalle ? (
              <DetalleImagen
                key={detalle.id}
                img={detalle}
                carpetas={carpetas.map((c) => c.nombre).filter(Boolean)}
                onCambio={(img) => {
                  setDetalle(img);
                  setLista((l) => (l ?? []).map((x) => (x.id === img.id ? img : x)));
                  void cargarFiltros();
                }}
                onQuitada={() => {
                  setDetalle(null);
                  refrescar();
                }}
                onCerrar={() => setDetalle(null)}
              />
            ) : (
              <div className='flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground'>
                <HiOutlinePhoto className='h-8 w-8' />
                Selecciona una imagen para ver su URL, editar sus datos y saber dónde se usa.
              </div>
            )}
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function ItemFiltro({ activo, onClick, icono, texto, cantidad }: { activo: boolean; onClick: () => void; icono: ReactNode; texto: string; cantidad?: number }) {
  return (
    <li>
      <button
        type='button'
        onClick={onClick}
        title={texto}
        className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-left ${activo ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-muted'}`}>
        {icono}
        <span className='min-w-0 flex-1 truncate'>{texto}</span>
        {cantidad !== undefined ? <span className='text-xs text-muted-foreground'>{cantidad}</span> : null}
      </button>
    </li>
  );
}

/** Fondo de cuadros para ver la transparencia de PNG. */
const CUADROS = { backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)', backgroundSize: '16px 16px' };

function Tarjeta({
  img,
  compacto,
  activa,
  marcada,
  onMarcar,
  onClick,
  onArrastrar,
}: {
  img: IImagen;
  compacto?: boolean;
  activa: boolean;
  marcada: boolean;
  onMarcar?: () => void;
  onClick: () => void;
  onArrastrar?: (img: IImagen | null, dt?: DataTransfer) => void;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-lg border bg-background transition ${activa || marcada ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50 hover:shadow-sm'}`}>
      <button
        type='button'
        onClick={onClick}
        draggable={Boolean(onArrastrar)}
        onDragStart={(e) => {
          if (!onArrastrar) return;
          e.dataTransfer.setData(MIME_IMAGEN, String(img.id));
          e.dataTransfer.setData('text/uri-list', img.url);
          e.dataTransfer.effectAllowed = 'copy';
          onArrastrar(img, e.dataTransfer);
        }}
        onDragEnd={() => onArrastrar?.(null)}
        title={`${img.nombre}${img.ancho ? ` · ${img.ancho}×${img.alto}` : ''}`}
        className={`block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${onArrastrar ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        <span className={`flex items-center justify-center overflow-hidden ${compacto ? 'h-20' : 'h-32'}`} style={CUADROS}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt ?? ''} loading='lazy' className='max-h-full max-w-full object-contain' draggable={false} />
        </span>
        <span className='block border-t border-border px-2 py-1.5'>
          <span className='block truncate text-xs font-medium text-foreground'>{img.nombre}</span>
          {!compacto ? (
            <span className='block text-[11px] text-muted-foreground'>
              {img.ancho ? `${img.ancho}×${img.alto}` : img.extension.toUpperCase()} · {formatoBytes(img.bytes)}
            </span>
          ) : null}
        </span>
      </button>
      {onMarcar ? (
        <label className={`absolute left-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-background/90 shadow ${marcada ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
          <input type='checkbox' aria-label={`Seleccionar ${img.nombre}`} className='h-4 w-4 accent-primary' checked={marcada} onChange={onMarcar} />
        </label>
      ) : null}
      {img.estado === 'ARCHIVADA' ? <span className='absolute right-1.5 top-1.5 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-semibold text-background'>Archivada</span> : null}
    </div>
  );
}

const RUTA_USO: Record<string, (codigo: string) => string | null> = {
  PLANTILLA: (c) => `/administre/email/plantillas/${encodeURIComponent(c)}/versiones`,
  COMPONENTE: () => '/administre/email/marca',
  MARCA: () => '/administre/email/marca',
};

function DetalleImagen({
  img,
  carpetas,
  onCambio,
  onQuitada,
  onCerrar,
}: {
  img: IImagen;
  carpetas: string[];
  onCambio: (img: IImagen) => void;
  onQuitada: () => void;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(img.nombre);
  const [alt, setAlt] = useState(img.alt ?? '');
  const [carpeta, setCarpeta] = useState(img.carpeta);
  const [etiquetas, setEtiquetas] = useState(img.etiquetas.join(', '));
  const [guardando, setGuardando] = useState(false);
  const [usos, setUsos] = useState<IUsosImagen | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    void usosImagenServerAction(img.id).then((r) => {
      if (vivo) setUsos(r.success ? r.data : { verificado: false, usos: [], mensaje: r.error });
    });
    return () => {
      vivo = false;
    };
  }, [img.id]);

  const cambios = nombre.trim() !== img.nombre || alt.trim() !== (img.alt ?? '') || carpeta.trim() !== img.carpeta || etiquetas !== img.etiquetas.join(', ');
  const etiquetasLista = useMemo(
    () =>
      etiquetas
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    [etiquetas],
  );

  const guardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    const r = await ejecutarAccion(() => actualizarImagenServerAction(img.id, { nombre: nombre.trim(), alt: alt.trim(), carpeta: carpeta.trim(), etiquetas: etiquetasLista }), {
      exito: 'Imagen actualizada',
      error: 'No se pudo guardar.',
    });
    setGuardando(false);
    if (r) onCambio(r);
  };

  const archivar = async () => {
    const archivar = img.estado === 'ACTIVA';
    const r = await ejecutarAccion(() => estadoImagenServerAction(img.id, archivar), {
      exito: archivar ? 'Imagen archivada' : 'Imagen restaurada',
      error: 'No se pudo cambiar el estado.',
    });
    if (r) onQuitada();
  };

  const eliminar = async () => {
    if (
      !(await confirmar(
        `¿Borrar "${img.nombre}"?`,
        'Se elimina de S3. Los correos YA ENVIADOS que la muestran la verán rota. Si dudas, archívala (oculta, pero su URL sigue funcionando).',
        'Sí, borrar',
      ))
    )
      return;
    const r = await ejecutarAccion(() => eliminarImagenServerAction(img.id), { exito: 'Imagen borrada', error: 'No se pudo borrar.' });
    if (r !== null) onQuitada();
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(img.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // sin permiso de portapapeles: el usuario puede seleccionar el texto
    }
  };

  const enUso = usos?.verificado && usos.usos.length > 0;
  const idCarpetas = `carpetas-${img.id}`;

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between gap-2'>
        <h3 className='min-w-0 truncate text-sm font-semibold' title={img.nombre}>
          {img.nombre}
        </h3>
        <button type='button' aria-label='Cerrar detalle' onClick={onCerrar} className='rounded p-1 text-muted-foreground hover:bg-muted'>
          <HiOutlineXMark className='h-4 w-4' />
        </button>
      </div>
      <a href={img.url} target='_blank' rel='noreferrer' className='flex h-44 items-center justify-center overflow-hidden rounded-xl border border-border' style={CUADROS} title='Abrir en otra pestaña'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.url} alt={img.alt ?? ''} className='max-h-full max-w-full object-contain' />
      </a>
      <dl className='grid grid-cols-2 gap-x-3 gap-y-1 text-xs'>
        <dt className='text-muted-foreground'>Dimensiones</dt>
        <dd>{img.ancho ? `${img.ancho} × ${img.alto} px` : '—'}</dd>
        <dt className='text-muted-foreground'>Peso</dt>
        <dd>
          {formatoBytes(img.bytes)} · {img.extension.toUpperCase()}
        </dd>
        <dt className='text-muted-foreground'>Subida</dt>
        <dd>
          {img.created_at ? new Date(img.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' }) : '—'}
          {img.creado_por_nombre ? ` · ${img.creado_por_nombre}` : ''}
        </dd>
      </dl>
      {img.ancho && img.ancho < 600 && img.ancho > 0 ? (
        <p className='flex gap-1.5 rounded-lg bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-200'>
          <HiOutlineExclamationTriangle className='h-4 w-4 shrink-0' /> Menos de 600 px: a todo el ancho del correo se verá borrosa en pantallas retina.
        </p>
      ) : null}
      <div className='space-y-1'>
        <p className='text-xs font-medium'>URL pública</p>
        <div className='flex gap-1.5'>
          <input readOnly value={img.url} className={`${claseInput} font-mono text-[11px]`} onFocus={(e) => e.target.select()} aria-label='URL pública' />
          <Buttons type='button' size='sm' variant='outline' onClick={() => void copiar()} title='Copiar URL'>
            {copiado ? <HiCheck className='h-4 w-4' /> : <HiOutlineClipboardDocument className='h-4 w-4' />}
          </Buttons>
        </div>
      </div>

      <div className='space-y-2 border-t border-border pt-3'>
        <label className='block space-y-1 text-xs font-medium'>
          Nombre
          <input className={claseInput} value={nombre} maxLength={150} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className='block space-y-1 text-xs font-medium'>
          Texto alternativo (alt)
          <input className={claseInput} value={alt} maxLength={255} placeholder='Describe la imagen' onChange={(e) => setAlt(e.target.value)} />
          <span className='block font-normal text-muted-foreground'>Se usa al insertarla en un correo; lo ven quienes bloquean imágenes.</span>
        </label>
        <label className='block space-y-1 text-xs font-medium'>
          Carpeta
          <input className={claseInput} value={carpeta} maxLength={80} list={idCarpetas} placeholder='Raíz' onChange={(e) => setCarpeta(e.target.value)} />
          <datalist id={idCarpetas}>
            {carpetas.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className='block space-y-1 text-xs font-medium'>
          Etiquetas
          <input className={claseInput} value={etiquetas} placeholder='logo, navidad, banner' onChange={(e) => setEtiquetas(e.target.value)} />
          <span className='block font-normal text-muted-foreground'>Separadas por coma.</span>
        </label>
        <Buttons type='button' size='sm' className='w-full' disabled={!cambios || !nombre.trim()} loading={guardando} onClick={() => void guardar()}>
          Guardar cambios
        </Buttons>
      </div>

      <div className='space-y-1.5 border-t border-border pt-3'>
        <p className='text-xs font-medium'>Dónde se usa</p>
        {usos === null ? <p className='text-xs text-muted-foreground'>Consultando…</p> : null}
        {usos && !usos.verificado ? <p className='text-xs text-amber-700'>No se pudo verificar: {usos.mensaje}</p> : null}
        {usos?.verificado && !usos.usos.length ? <p className='text-xs text-muted-foreground'>En ninguna plantilla, componente ni en la marca.</p> : null}
        {enUso ? (
          <ul className='space-y-1 text-xs'>
            {usos!.usos.map((u) => {
              const href = RUTA_USO[u.tipo]?.(u.codigo);
              return (
                <li key={`${u.tipo}-${u.codigo}`} className='rounded-lg bg-muted/50 px-2 py-1.5'>
                  <span className='mr-1 text-[10px] font-semibold uppercase text-muted-foreground'>{u.tipo.toLowerCase()}</span>
                  {href ? (
                    <Link href={href} className='font-medium underline'>
                      {u.nombre || u.codigo}
                    </Link>
                  ) : (
                    <span className='font-medium'>{u.nombre || u.codigo}</span>
                  )}
                  {u.detalle ? <span className='block text-muted-foreground'>{u.detalle}</span> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className='flex flex-wrap gap-2 border-t border-border pt-3'>
        <Buttons type='button' size='sm' variant='outline' onClick={() => void archivar()}>
          <HiOutlineArchiveBox className='h-4 w-4' /> {img.estado === 'ACTIVA' ? 'Archivar' : 'Restaurar'}
        </Buttons>
        <Buttons
          type='button'
          size='sm'
          variant='ghost'
          className='text-destructive hover:text-destructive/80'
          disabled={!usos || !usos.verificado || enUso}
          title={enUso ? 'Está en uso: quítala de esas plantillas o archívala' : !usos?.verificado ? 'No se pudo verificar el uso' : 'Borrar definitivamente'}
          onClick={() => void eliminar()}>
          <HiOutlineTrash className='h-4 w-4' /> Borrar
        </Buttons>
      </div>
    </div>
  );
}
