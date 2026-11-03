/** @format */

'use client';

import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlinePlus, HiOutlineTrash, HiOutlineXMark } from 'react-icons/hi2';
import {
  FUENTES,
  PALETA,
  REDES,
  type AjustesDiseno,
  type Bloque,
  type BloqueColumnas,
  type Distribucion,
  type RedSocial,
} from '../models/diseno';
import { cambiarDistribucion } from '../utils/operaciones';
import { BotonElegirImagen } from '../../../../imagenes/components/selector-imagen';
import { anchoEnCorreo } from '../../../../imagenes/utils/optimizar';
import { CampoAlineacion, CampoArea, CampoColor, CampoInterruptor, CampoNumero, CampoSelect, CampoTexto, Seccion } from './campos';

interface Props {
  bloque: Bloque;
  onChange: (cambios: Partial<Bloque>) => void;
  onCerrar: () => void;
  onEliminar: () => void;
  variables: string[];
}

const DISTRIBUCIONES: { value: Distribucion; label: string }[] = [
  { value: '50-50', label: '2 columnas · 50 / 50' },
  { value: '33-67', label: '2 columnas · 33 / 67' },
  { value: '67-33', label: '2 columnas · 67 / 33' },
  { value: '33-33-33', label: '3 columnas' },
];

/** Panel derecho: propiedades del bloque seleccionado (el texto se edita directamente en el lienzo). */
export function PanelPropiedades({ bloque: b, onChange, onCerrar, onEliminar, variables }: Props) {
  const set = <K extends string>(k: K) => (v: unknown) => onChange({ [k]: v } as Partial<Bloque>);
  const setEstilo = (k: keyof Bloque['estilo']) => (v: string | number) => onChange({ estilo: { ...b.estilo, [k]: v } });
  const nombre = PALETA.find((p) => p.tipo === b.tipo)?.etiqueta ?? b.tipo;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>Bloque</p>
          <h3 className='text-base font-semibold text-foreground'>{nombre}</h3>
        </div>
        <button type='button' onClick={onCerrar} aria-label='Cerrar propiedades' className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'>
          <HiOutlineXMark className='h-5 w-5' />
        </button>
      </div>

      {b.tipo === 'encabezado' || b.tipo === 'texto' || b.tipo === 'pie' ? (
        <p className='rounded-lg bg-primary/5 p-2.5 text-xs text-muted-foreground'>
          Escribe directamente en el lienzo. Selecciona texto para darle formato o usa <strong>Personalizar</strong> para insertar variables.
        </p>
      ) : null}

      {b.tipo === 'encabezado' ? (
        <Seccion titulo='Estilo'>
          <CampoSelect
            etiqueta='Nivel'
            valor={String(b.nivel) as '1' | '2' | '3'}
            onChange={(v) => onChange({ nivel: Number(v) as 1 | 2 | 3 })}
            opciones={[
              { value: '1', label: 'Título grande (H1)' },
              { value: '2', label: 'Título mediano (H2)' },
              { value: '3', label: 'Subtítulo (H3)' },
            ]}
          />
          <CampoAlineacion valor={b.alineacion} onChange={set('alineacion')} />
          <CampoColor etiqueta='Color' valor={b.color} onChange={set('color')} permitirVacio textoVacio='Color del texto global' />
        </Seccion>
      ) : null}

      {b.tipo === 'texto' ? (
        <Seccion titulo='Estilo'>
          <CampoAlineacion valor={b.alineacion} onChange={set('alineacion')} />
          <CampoNumero etiqueta='Tamaño de letra (0 = global)' valor={b.tamano} min={0} max={32} onChange={set('tamano')} />
          <CampoNumero etiqueta='Interlineado' valor={b.interlineado} min={1} max={2.5} paso={0.1} unidad='' onChange={set('interlineado')} />
          <CampoColor etiqueta='Color' valor={b.color} onChange={set('color')} permitirVacio textoVacio='Color del texto global' />
        </Seccion>
      ) : null}

      {b.tipo === 'pie' ? (
        <Seccion titulo='Estilo'>
          <CampoAlineacion valor={b.alineacion} onChange={set('alineacion')} />
          <CampoNumero etiqueta='Tamaño de letra' valor={b.tamano} min={10} max={18} onChange={set('tamano')} />
          <CampoColor etiqueta='Color' valor={b.color} onChange={set('color')} />
        </Seccion>
      ) : null}

      {b.tipo === 'imagen' ? (
        <Seccion titulo='Imagen'>
          <div className='flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-2'>
            <span className='text-[11px] leading-4 text-muted-foreground'>Elige o sube una imagen propia (se optimiza y publica sola).</span>
            <BotonElegirImagen
              className='inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90'
              onElegir={(img) => onChange({ url: img.url, alt: img.alt || img.nombre, ancho: anchoEnCorreo(img.ancho) } as Partial<Bloque>)}
            />
          </div>
          <CampoTexto
            etiqueta='URL de la imagen'
            tipo='url'
            valor={b.url}
            onChange={set('url')}
            placeholder='https://…/imagen.png'
            variables={variables}
            ayuda='O pega una URL pública (https). Ideal: PNG o JPG de 1200 px de ancho.'
          />
          <CampoTexto etiqueta='Texto alternativo' valor={b.alt} onChange={set('alt')} placeholder='Describe la imagen' ayuda='Se muestra si el cliente bloquea imágenes.' />
          <CampoTexto etiqueta='Enlace al hacer clic (opcional)' tipo='url' valor={b.enlace} onChange={set('enlace')} placeholder='https://' variables={variables} />
          <CampoNumero etiqueta='Ancho' valor={b.ancho} min={10} max={100} unidad='%' onChange={set('ancho')} />
          <CampoAlineacion valor={b.alineacion} onChange={set('alineacion')} />
          <CampoNumero etiqueta='Bordes redondeados' valor={b.redondeo} min={0} max={40} onChange={set('redondeo')} />
        </Seccion>
      ) : null}

      {b.tipo === 'boton' ? (
        <>
          <Seccion titulo='Contenido'>
            <CampoTexto etiqueta='Texto del botón' valor={b.texto} onChange={set('texto')} variables={variables} />
            <CampoTexto etiqueta='Enlace' tipo='url' valor={b.url} onChange={set('url')} placeholder='https://' variables={variables} />
          </Seccion>
          <Seccion titulo='Estilo'>
            <CampoColor etiqueta='Color de fondo' valor={b.colorFondo} onChange={set('colorFondo')} />
            <CampoColor etiqueta='Color del texto' valor={b.colorTexto} onChange={set('colorTexto')} />
            <CampoNumero etiqueta='Tamaño de letra' valor={b.tamano} min={12} max={24} onChange={set('tamano')} />
            <CampoNumero etiqueta='Bordes redondeados' valor={b.redondeo} min={0} max={30} onChange={set('redondeo')} />
            <CampoAlineacion valor={b.alineacion} onChange={set('alineacion')} />
            <CampoInterruptor etiqueta='Ancho completo' valor={b.anchoCompleto} onChange={set('anchoCompleto')} />
          </Seccion>
        </>
      ) : null}

      {b.tipo === 'divisor' ? (
        <Seccion titulo='Línea'>
          <CampoColor etiqueta='Color' valor={b.color} onChange={set('color')} />
          <CampoNumero etiqueta='Grosor' valor={b.grosor} min={1} max={8} onChange={set('grosor')} />
          <CampoSelect
            etiqueta='Estilo'
            valor={b.linea}
            onChange={set('linea')}
            opciones={[
              { value: 'solid', label: 'Continua' },
              { value: 'dashed', label: 'Discontinua' },
              { value: 'dotted', label: 'Punteada' },
            ]}
          />
        </Seccion>
      ) : null}

      {b.tipo === 'espaciador' ? (
        <Seccion titulo='Espacio'>
          <CampoNumero etiqueta='Alto' valor={b.alto} min={4} max={160} onChange={set('alto')} />
        </Seccion>
      ) : null}

      {b.tipo === 'redes' ? (
        <Seccion titulo='Redes sociales'>
          <div className='space-y-2'>
            {b.redes.map((r, i) => (
              <div key={i} className='space-y-1.5 rounded-lg border border-border p-2'>
                <div className='flex items-center gap-2'>
                  <select
                    aria-label={`Red ${i + 1}`}
                    value={r.red}
                    onChange={(e) => onChange({ redes: b.redes.map((x, j) => (j === i ? { ...x, red: e.target.value as RedSocial } : x)) })}
                    className='h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs'>
                    {(Object.keys(REDES) as RedSocial[]).map((k) => (
                      <option key={k} value={k}>
                        {REDES[k].nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    aria-label={`Quitar ${REDES[r.red]?.nombre ?? 'red'}`}
                    onClick={() => onChange({ redes: b.redes.filter((_, j) => j !== i) })}
                    className='rounded-md p-1.5 text-destructive hover:bg-destructive/10'>
                    <HiOutlineTrash className='h-4 w-4' />
                  </button>
                </div>
                <input
                  aria-label={`URL de ${REDES[r.red]?.nombre ?? 'la red'}`}
                  value={r.url}
                  onChange={(e) => onChange({ redes: b.redes.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
                  placeholder='https://'
                  className='h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'
                />
              </div>
            ))}
            <button
              type='button'
              onClick={() => onChange({ redes: [...b.redes, { red: 'web', url: 'https://' }] })}
              className='inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground'>
              <HiOutlinePlus className='h-4 w-4' /> Agregar red
            </button>
          </div>
          <CampoAlineacion valor={b.alineacion} onChange={set('alineacion')} />
          <CampoSelect
            etiqueta='Iconos'
            valor={b.variante}
            onChange={set('variante')}
            opciones={[
              { value: 'color', label: 'Color de cada red' },
              { value: 'oscuro', label: 'Color del texto' },
            ]}
          />
        </Seccion>
      ) : null}

      {b.tipo === 'html' ? (
        <Seccion titulo='Código HTML'>
          <CampoArea etiqueta='HTML (se inserta tal cual en el correo)' valor={b.codigo} onChange={set('codigo')} filas={14} mono />
          <p className='text-[11px] text-muted-foreground'>Usa estilos en línea y tablas: muchos clientes de correo ignoran CSS externo y no ejecutan scripts.</p>
        </Seccion>
      ) : null}

      {b.tipo === 'tabla' ? (
        <>
          <Seccion titulo='Filas'>
            <div className='space-y-2'>
              {b.filas.map((f, i) => (
                <div key={i} className='space-y-1.5 rounded-lg border border-border p-2'>
                  <div className='flex items-center gap-1'>
                    <input
                      aria-label={`Etiqueta de la fila ${i + 1}`}
                      value={f.etiqueta}
                      placeholder='Etiqueta'
                      onChange={(e) => onChange({ filas: b.filas.map((x, j) => (j === i ? { ...x, etiqueta: e.target.value } : x)) })}
                      className='h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    />
                    <button type='button' aria-label='Subir fila' disabled={i === 0} onClick={() => onChange({ filas: mover(b.filas, i, -1) })} className='rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30'>
                      <HiOutlineArrowUp className='h-3.5 w-3.5' />
                    </button>
                    <button type='button' aria-label='Bajar fila' disabled={i === b.filas.length - 1} onClick={() => onChange({ filas: mover(b.filas, i, 1) })} className='rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30'>
                      <HiOutlineArrowDown className='h-3.5 w-3.5' />
                    </button>
                    <button type='button' aria-label='Quitar fila' onClick={() => onChange({ filas: b.filas.filter((_, j) => j !== i) })} className='rounded-md p-1 text-destructive hover:bg-destructive/10'>
                      <HiOutlineTrash className='h-3.5 w-3.5' />
                    </button>
                  </div>
                  <CampoTexto etiqueta='Valor' valor={f.valor} variables={variables} onChange={(v) => onChange({ filas: b.filas.map((x, j) => (j === i ? { ...x, valor: v } : x)) })} />
                </div>
              ))}
              <button
                type='button'
                onClick={() => onChange({ filas: [...b.filas, { etiqueta: 'Nuevo dato', valor: '' }] })}
                className='inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground'>
                <HiOutlinePlus className='h-4 w-4' /> Agregar fila
              </button>
            </div>
          </Seccion>
          <Seccion titulo='Estilo'>
            <CampoInterruptor etiqueta='Filas alternas (cebra)' valor={b.cebra} onChange={set('cebra')} />
            <CampoInterruptor etiqueta='Resaltar última fila (total)' valor={b.resaltarUltima} onChange={set('resaltarUltima')} />
            <CampoNumero etiqueta='Tamaño de letra' valor={b.tamano} min={11} max={20} onChange={set('tamano')} />
            <CampoColor etiqueta='Color de las etiquetas' valor={b.colorEtiqueta} onChange={set('colorEtiqueta')} />
            <CampoColor etiqueta='Color de bordes' valor={b.colorBorde} onChange={set('colorBorde')} />
          </Seccion>
        </>
      ) : null}

      {b.tipo === 'columnas' ? (
        <Seccion titulo='Columnas'>
          <CampoSelect etiqueta='Distribución' valor={b.distribucion} onChange={(v) => onChange(cambiarDistribucion(b as BloqueColumnas, v))} opciones={DISTRIBUCIONES} />
          <CampoNumero etiqueta='Separación' valor={b.espacio} min={0} max={48} onChange={set('espacio')} />
          <CampoSelect
            etiqueta='Alineación vertical'
            valor={b.vertical}
            onChange={set('vertical')}
            opciones={[
              { value: 'top', label: 'Arriba' },
              { value: 'middle', label: 'Centro' },
            ]}
          />
          <p className='text-[11px] text-muted-foreground'>En celulares las columnas se apilan una debajo de otra.</p>
        </Seccion>
      ) : null}

      <Seccion titulo='Espaciado y fondo'>
        <CampoNumero etiqueta='Relleno vertical' valor={b.estilo.rellenoV} min={0} max={80} onChange={setEstilo('rellenoV')} />
        <CampoNumero etiqueta='Relleno horizontal' valor={b.estilo.rellenoH} min={0} max={80} onChange={setEstilo('rellenoH')} />
        <CampoColor etiqueta='Fondo del bloque' valor={b.estilo.fondo} onChange={setEstilo('fondo')} permitirVacio textoVacio='Transparente' />
      </Seccion>

      <button
        type='button'
        onClick={onEliminar}
        className='inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10'>
        <HiOutlineTrash className='h-4 w-4' /> Eliminar bloque
      </button>
    </div>
  );
}

function mover<T>(lista: T[], i: number, delta: -1 | 1): T[] {
  const j = i + delta;
  if (j < 0 || j >= lista.length) return lista;
  const copia = [...lista];
  [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  return copia;
}

/** Estilos globales del correo (pestaña "Estilo" del panel izquierdo). */
export function PanelEstilos({ ajustes, onChange }: { ajustes: AjustesDiseno; onChange: (a: Partial<AjustesDiseno>) => void }) {
  return (
    <div className='space-y-4'>
      <Seccion titulo='Diseño'>
        <CampoNumero etiqueta='Ancho del correo' valor={ajustes.ancho} min={480} max={800} paso={10} onChange={(v) => onChange({ ancho: v })} />
        <CampoColor etiqueta='Fondo exterior' valor={ajustes.fondoExterior} onChange={(v) => onChange({ fondoExterior: v })} />
        <CampoColor etiqueta='Fondo del contenido' valor={ajustes.fondoContenido} onChange={(v) => onChange({ fondoContenido: v })} />
        <CampoNumero etiqueta='Bordes redondeados' valor={ajustes.redondeo} min={0} max={24} onChange={(v) => onChange({ redondeo: v })} />
      </Seccion>
      <Seccion titulo='Texto'>
        <CampoSelect etiqueta='Fuente' valor={ajustes.fuente} onChange={(v) => onChange({ fuente: v })} opciones={FUENTES} />
        <CampoNumero etiqueta='Tamaño base' valor={ajustes.tamanoBase} min={12} max={22} onChange={(v) => onChange({ tamanoBase: v })} />
        <CampoColor etiqueta='Color del texto' valor={ajustes.colorTexto} onChange={(v) => onChange({ colorTexto: v })} />
        <CampoColor etiqueta='Color de los enlaces' valor={ajustes.colorEnlace} onChange={(v) => onChange({ colorEnlace: v })} />
      </Seccion>
    </div>
  );
}
