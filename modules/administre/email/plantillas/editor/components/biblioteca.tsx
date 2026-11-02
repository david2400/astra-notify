/** @format */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiOutlineArchiveBox, HiOutlineArrowPath, HiOutlineBookmark, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { Modal } from '@repo/ui/modals/scenes';
import { Buttons } from '@repo/ui/buttons/scenes';
import {
  archivarComponenteEmailServerAction,
  crearComponenteEmailServerAction,
  listarComponentesEmailServerAction,
} from '@/app/[locale]/(protected)/administre/email/marca/actions';
import type { CategoriaComponente, IComponente } from '@/server/domains/administre/email/disenos/types';
import { confirmar, ejecutarAccion } from '../../../shared/utils/feedback';
import { clonarConIdsNuevos, type Bloque, type Diseno } from '../models/diseno';
import { ajustesDeMarca, type MarcaEditor } from '../models/marca';
import { generarHtml } from '../utils/generar-html';
import { CATEGORIAS_SECCION, SECCIONES, type Seccion } from '../utils/secciones';
import { MIME_NUEVO, type Arrastre } from './lienzo';

export const CATEGORIAS_COMPONENTE: { value: CategoriaComponente; label: string }[] = [
  { value: 'ENCABEZADO', label: 'Encabezado' },
  { value: 'CONTENIDO', label: 'Contenido' },
  { value: 'ACCION', label: 'Llamado a la acción' },
  { value: 'DATOS', label: 'Datos' },
  { value: 'PIE', label: 'Pie de página' },
  { value: 'OTRO', label: 'Otro' },
];

/** Bloques de un componente guardado (con ids nuevos), o null si su JSON no es válido. */
export function bloquesDeComponente(c: IComponente): Bloque[] | null {
  try {
    const d = JSON.parse(c.contenido_json) as { version?: number; bloques?: Bloque[] };
    if (d.version !== 1 || !Array.isArray(d.bloques) || !d.bloques.length) return null;
    return d.bloques.map((b) => clonarConIdsNuevos(b));
  } catch {
    return null;
  }
}

const tipoArrastre = (bloques: Bloque[]) => (bloques.some((b) => b.tipo === 'columnas') ? 'columnas' : bloques[0]!.tipo);

/** Miniatura de unos bloques con la marca aplicada (iframe sin scripts, escalado al ancho de la tarjeta). */
function Miniatura({ bloques, marca, alto = 96 }: { bloques: Bloque[]; marca: MarcaEditor; alto?: number }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    const a = ajustesDeMarca(marca);
    const d: Diseno = { version: 1, ajustes: { ...a, fondoExterior: a.fondoContenido, redondeo: 0 }, bloques };
    setHtml(generarHtml(d).replace('padding:24px 12px', 'padding:0'));
  }, [bloques, marca]);
  return (
    <div className='relative overflow-hidden rounded-t-lg bg-white' style={{ height: alto }}>
      {html ? (
        <iframe
          title='Miniatura'
          sandbox=''
          srcDoc={html}
          tabIndex={-1}
          aria-hidden='true'
          loading='lazy'
          className='pointer-events-none absolute left-0 top-0 origin-top-left border-0'
          style={{ width: 600, height: alto / 0.37, transform: 'scale(0.37)' }}
        />
      ) : (
        <div className='h-full animate-pulse bg-muted' />
      )}
    </div>
  );
}

function TarjetaArrastrable({
  titulo,
  descripcion,
  bloques,
  marca,
  onArrastre,
  onInsertar,
  acciones,
}: {
  titulo: string;
  descripcion?: string | null;
  bloques: Bloque[];
  marca: MarcaEditor;
  onArrastre: (a: Arrastre) => void;
  onInsertar: (bloques: Bloque[]) => void;
  acciones?: React.ReactNode;
}) {
  return (
    <div className='group overflow-hidden rounded-lg border border-border bg-background transition hover:border-primary/50 hover:shadow-sm'>
      <button
        type='button'
        draggable
        title={`${titulo}: arrastra al correo o haz clic para agregar`}
        aria-label={`Agregar ${titulo}`}
        onDragStart={(e) => {
          e.dataTransfer.setData(MIME_NUEVO, 'seccion');
          e.dataTransfer.effectAllowed = 'copy';
          // Bloques nuevos en cada arrastre (ids únicos)
          const copia = bloques.map((b) => clonarConIdsNuevos(b));
          onArrastre({ clase: 'seccion', bloques: copia, tipo: tipoArrastre(copia) });
        }}
        onDragEnd={() => onArrastre(null)}
        onClick={() => onInsertar(bloques.map((b) => clonarConIdsNuevos(b)))}
        className='block w-full cursor-grab text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing'>
        <Miniatura bloques={bloques} marca={marca} />
        <span className='block border-t border-border px-2.5 py-2'>
          <span className='block truncate text-xs font-semibold text-foreground'>{titulo}</span>
          {descripcion ? <span className='line-clamp-2 block text-[11px] leading-4 text-muted-foreground'>{descripcion}</span> : null}
        </span>
      </button>
      {acciones ? <div className='flex justify-end gap-1 border-t border-border px-1.5 py-1'>{acciones}</div> : null}
    </div>
  );
}

function Buscador({ valor, onChange, placeholder }: { valor: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className='relative block'>
      <span className='sr-only'>{placeholder}</span>
      <HiOutlineMagnifyingGlass className='pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='h-9 w-full rounded-lg border border-input bg-background pl-8 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
      />
    </label>
  );
}

function Chips<T extends string>({ opciones, valor, onChange }: { opciones: { value: T; label: string }[]; valor: T | ''; onChange: (v: T | '') => void }) {
  return (
    <div className='flex flex-wrap gap-1' role='group' aria-label='Categoría'>
      {[{ value: '' as const, label: 'Todas' }, ...opciones].map((o) => (
        <button
          key={o.value || 'todas'}
          type='button'
          aria-pressed={valor === o.value}
          onClick={() => onChange(o.value as T | '')}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
            valor === o.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Secciones prediseñadas con la marca corporativa. */
export function PanelSecciones({ marca, onArrastre, onInsertar }: { marca: MarcaEditor; onArrastre: (a: Arrastre) => void; onInsertar: (b: Bloque[]) => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Seccion['categoria'] | ''>('');
  // Se crean una vez por marca (las miniaturas no se regeneran en cada render)
  const items = useMemo(() => SECCIONES.map((s) => ({ s, bloques: s.crear(marca) })), [marca]);
  const visibles = items.filter(({ s }) => (!cat || s.categoria === cat) && (!q || normalizar(`${s.nombre} ${s.descripcion}`).includes(normalizar(q))));
  return (
    <div className='space-y-3'>
      <Buscador valor={q} onChange={setQ} placeholder='Buscar secciones' />
      <Chips opciones={CATEGORIAS_SECCION.map((c) => ({ value: c.id, label: c.etiqueta }))} valor={cat} onChange={setCat} />
      {CATEGORIAS_SECCION.filter((c) => visibles.some((v) => v.s.categoria === c.id)).map((c) => (
        <section key={c.id} className='space-y-2'>
          <h4 className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>{c.etiqueta}</h4>
          <div className='grid gap-2'>
            {visibles
              .filter((v) => v.s.categoria === c.id)
              .map(({ s, bloques }) => (
                <TarjetaArrastrable key={s.id} titulo={s.nombre} descripcion={s.descripcion} bloques={bloques} marca={marca} onArrastre={onArrastre} onInsertar={onInsertar} />
              ))}
          </div>
        </section>
      ))}
      {!visibles.length ? <p className='text-xs text-muted-foreground'>Sin resultados.</p> : null}
    </div>
  );
}

/** Componentes guardados por la empresa (email_gateway /admin/componentes). */
export function PanelGuardados({
  marca,
  onArrastre,
  onInsertar,
  version,
}: {
  marca: MarcaEditor;
  onArrastre: (a: Arrastre) => void;
  onInsertar: (b: Bloque[]) => void;
  /** Cambia al guardar un componente nuevo (recarga la lista). */
  version: number;
}) {
  const [lista, setLista] = useState<IComponente[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoriaComponente | ''>('');

  const cargar = useCallback(async () => {
    setError(null);
    const r = await listarComponentesEmailServerAction();
    if (r.success) setLista(r.data);
    else setError(r.error);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar, version]);

  const archivar = async (c: IComponente) => {
    if (!(await confirmar(`¿Archivar "${c.nombre}"?`, 'Deja de aparecer en la biblioteca. Las plantillas que ya lo usan no cambian.'))) return;
    const ok = await ejecutarAccion(() => archivarComponenteEmailServerAction(c.id, true), { exito: 'Componente archivado', error: 'No se pudo archivar.' });
    if (ok) void cargar();
  };

  const items = useMemo(
    () => (lista ?? []).map((c) => ({ c, bloques: bloquesDeComponente(c) })).filter((x): x is { c: IComponente; bloques: Bloque[] } => x.bloques !== null),
    [lista],
  );
  const visibles = items.filter(({ c }) => (!cat || c.categoria === cat) && (!q || normalizar(`${c.nombre} ${c.descripcion ?? ''}`).includes(normalizar(q))));

  return (
    <div className='space-y-3'>
      <div className='flex gap-1.5'>
        <div className='flex-1'>
          <Buscador valor={q} onChange={setQ} placeholder='Buscar componentes' />
        </div>
        <button type='button' title='Recargar' aria-label='Recargar componentes' onClick={() => void cargar()} className='rounded-lg border border-input px-2 text-muted-foreground hover:bg-muted'>
          <HiOutlineArrowPath className='h-4 w-4' />
        </button>
      </div>
      <Chips opciones={CATEGORIAS_COMPONENTE} valor={cat} onChange={setCat} />
      {error ? <p className='rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive'>{error}</p> : null}
      {lista === null && !error ? <p className='text-xs text-muted-foreground'>Cargando…</p> : null}
      {lista !== null && !items.length ? (
        <div className='rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground'>
          <HiOutlineBookmark className='mx-auto mb-1 h-5 w-5' />
          Aún no hay componentes guardados. Selecciona un bloque en el correo y usa <strong>Guardar como componente</strong> (ícono de marcador) para reutilizarlo en otras plantillas.
        </div>
      ) : null}
      <div className='grid gap-2'>
        {visibles.map(({ c, bloques }) => (
          <TarjetaArrastrable
            key={c.id}
            titulo={c.nombre}
            descripcion={c.descripcion ?? CATEGORIAS_COMPONENTE.find((x) => x.value === c.categoria)?.label}
            bloques={bloques}
            marca={marca}
            onArrastre={onArrastre}
            onInsertar={onInsertar}
            acciones={
              <button type='button' onClick={() => void archivar(c)} className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground'>
                <HiOutlineArchiveBox className='h-3.5 w-3.5' /> Archivar
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}

/** Diálogo "Guardar como componente" del bloque seleccionado. */
/** @param bloques el bloque seleccionado o todo el diseño */
export function DialogoGuardarComponente({ bloques, onCerrar, onGuardado }: { bloques: Bloque[] | null; onCerrar: () => void; onGuardado: () => void }) {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaComponente>('CONTENIDO');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!bloques?.length) return;
    const t = bloques[0]!.tipo;
    setNombre('');
    setDescripcion('');
    setCategoria(bloques.length > 1 ? 'OTRO' : t === 'pie' || t === 'redes' ? 'PIE' : t === 'boton' ? 'ACCION' : t === 'tabla' ? 'DATOS' : 'CONTENIDO');
  }, [bloques]);

  const guardar = async () => {
    if (!bloques?.length || !nombre.trim()) return;
    setGuardando(true);
    const ok = await ejecutarAccion(
      () =>
        crearComponenteEmailServerAction({
          nombre: nombre.trim(),
          categoria,
          descripcion: descripcion.trim() || null,
          contenido_json: JSON.stringify({ version: 1, bloques }),
        }),
      { exito: 'Componente guardado en la biblioteca', error: 'No se pudo guardar el componente.' },
    );
    setGuardando(false);
    if (ok) {
      onGuardado();
      onCerrar();
    }
  };

  return (
    <Modal size='md' title='Guardar como componente' open={bloques !== null} onOpenChange={(o) => !o && onCerrar()} hideDefaultFooter>
      <div className='space-y-4'>
        <p className='text-sm text-muted-foreground'>
          {bloques && bloques.length > 1 ? `Los ${bloques.length} bloques del diseño` : 'El bloque'} (con su contenido y estilo) quedan en la pestaña <strong>Guardados</strong> para arrastrarlos en cualquier
          plantilla.
        </p>
        <label className='block space-y-1.5'>
          <span className='text-sm font-medium'>Nombre</span>
          <input
            autoFocus
            value={nombre}
            maxLength={120}
            onChange={(e) => setNombre(e.target.value)}
            placeholder='Ej. Encabezado institucional'
            className='h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
          />
        </label>
        <label className='block space-y-1.5'>
          <span className='text-sm font-medium'>Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaComponente)} className='h-10 w-full rounded-lg border border-input bg-background px-3 text-sm'>
            {CATEGORIAS_COMPONENTE.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className='block space-y-1.5'>
          <span className='text-sm font-medium'>Descripción (opcional)</span>
          <input
            value={descripcion}
            maxLength={300}
            onChange={(e) => setDescripcion(e.target.value)}
            className='h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
          />
        </label>
        <div className='flex justify-end gap-2'>
          <Buttons type='button' variant='outline' onClick={onCerrar}>
            Cancelar
          </Buttons>
          <Buttons type='button' loading={guardando} disabled={!nombre.trim()} onClick={() => void guardar()}>
            Guardar componente
          </Buttons>
        </div>
      </div>
    </Modal>
  );
}
