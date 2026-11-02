/** @format */

import { clonarConIdsNuevos, type Bloque, type BloqueColumnas, type BloqueSimple, type Destino, type Diseno } from '../models/diseno';

/** Operaciones inmutables sobre el árbol de bloques (raíz + columnas de un nivel). */

export interface Ubicacion {
  padre: { id: string; col: number } | null;
  indice: number;
}

export function buscar(d: Diseno, id: string): { bloque: Bloque; ubicacion: Ubicacion } | null {
  for (let i = 0; i < d.bloques.length; i++) {
    const b = d.bloques[i]!;
    if (b.id === id) return { bloque: b, ubicacion: { padre: null, indice: i } };
    if (b.tipo === 'columnas') {
      for (let c = 0; c < b.columnas.length; c++) {
        const j = b.columnas[c]!.findIndex((x) => x.id === id);
        if (j >= 0) return { bloque: b.columnas[c]![j]!, ubicacion: { padre: { id: b.id, col: c }, indice: j } };
      }
    }
  }
  return null;
}

const conColumna = (d: Diseno, padreId: string, col: number, fn: (lista: BloqueSimple[]) => BloqueSimple[]): Diseno => ({
  ...d,
  bloques: d.bloques.map((b) =>
    b.id === padreId && b.tipo === 'columnas' ? { ...b, columnas: b.columnas.map((lista, i) => (i === col ? fn(lista) : lista)) } : b,
  ),
});

/** Inserta en el destino. Un bloque de columnas solo puede ir en la raíz. */
export function insertar(d: Diseno, destino: Destino, bloque: Bloque): Diseno {
  if (!destino.padre) {
    const bloques = [...d.bloques];
    bloques.splice(Math.max(0, Math.min(destino.indice, bloques.length)), 0, bloque);
    return { ...d, bloques };
  }
  if (bloque.tipo === 'columnas') return d;
  return conColumna(d, destino.padre.id, destino.padre.col, (lista) => {
    const nueva = [...lista];
    nueva.splice(Math.max(0, Math.min(destino.indice, nueva.length)), 0, bloque);
    return nueva;
  });
}

export function eliminar(d: Diseno, id: string): Diseno {
  const u = buscar(d, id);
  if (!u) return d;
  if (!u.ubicacion.padre) return { ...d, bloques: d.bloques.filter((b) => b.id !== id) };
  return conColumna(d, u.ubicacion.padre.id, u.ubicacion.padre.col, (lista) => lista.filter((b) => b.id !== id));
}

export function actualizar(d: Diseno, id: string, cambios: Partial<Bloque>): Diseno {
  const aplicar = <T extends Bloque>(b: T): T => (b.id === id ? ({ ...b, ...cambios, id: b.id, tipo: b.tipo } as T) : b);
  return {
    ...d,
    bloques: d.bloques.map((b) => {
      const nuevo = aplicar(b);
      if (nuevo.tipo !== 'columnas' || nuevo !== b) return nuevo;
      return { ...nuevo, columnas: nuevo.columnas.map((col) => col.map(aplicar)) } as BloqueColumnas;
    }),
  };
}

/** Mueve un bloque al destino (índice calculado ANTES de quitarlo de su lugar). */
export function mover(d: Diseno, id: string, destino: Destino): Diseno {
  const u = buscar(d, id);
  if (!u) return d;
  if (u.bloque.tipo === 'columnas' && destino.padre) return d;
  if (destino.padre?.id === id) return d;
  const mismoContenedor =
    (!u.ubicacion.padre && !destino.padre) ||
    (u.ubicacion.padre && destino.padre && u.ubicacion.padre.id === destino.padre.id && u.ubicacion.padre.col === destino.padre.col);
  let indice = destino.indice;
  if (mismoContenedor && u.ubicacion.indice < indice) indice -= 1;
  if (mismoContenedor && u.ubicacion.indice === indice) return d;
  return insertar(eliminar(d, id), { ...destino, indice }, u.bloque);
}

/** Sube (-1) o baja (+1) un bloque dentro de su contenedor. */
export function desplazar(d: Diseno, id: string, delta: -1 | 1): Diseno {
  const u = buscar(d, id);
  if (!u) return d;
  const destino = { padre: u.ubicacion.padre, indice: u.ubicacion.indice + (delta > 0 ? 2 : -1) };
  return mover(d, id, destino);
}

export function duplicar(d: Diseno, id: string): { diseno: Diseno; nuevoId: string | null } {
  const u = buscar(d, id);
  if (!u) return { diseno: d, nuevoId: null };
  const copia = clonarConIdsNuevos(u.bloque);
  return { diseno: insertar(d, { padre: u.ubicacion.padre, indice: u.ubicacion.indice + 1 }, copia), nuevoId: copia.id };
}

/** Cambia la distribución de un bloque de columnas conservando el contenido (2 ↔ 3 columnas). */
export function cambiarDistribucion(b: BloqueColumnas, distribucion: BloqueColumnas['distribucion']): BloqueColumnas {
  const n = distribucion === '33-33-33' ? 3 : 2;
  let columnas = b.columnas.slice(0, n);
  if (b.columnas.length > n) columnas[n - 1] = [...columnas[n - 1]!, ...b.columnas.slice(n).flat()];
  while (columnas.length < n) columnas = [...columnas, []];
  return { ...b, distribucion, columnas };
}

/**
 * Inserta varios bloques (una sección o un componente guardado) a partir del destino. Si el destino es una
 * columna y la sección trae columnas, se inserta en la raíz justo después del bloque de columnas.
 */
export function insertarVarios(d: Diseno, destino: Destino, bloques: Bloque[]): Diseno {
  let dest = destino;
  if (dest.padre && bloques.some((b) => b.tipo === 'columnas')) {
    const padre = buscar(d, dest.padre.id);
    dest = { padre: null, indice: padre ? padre.ubicacion.indice + 1 : d.bloques.length };
  }
  return bloques.reduce((acc, b, i) => insertar(acc, { padre: dest.padre, indice: dest.indice + i }, b), d);
}
