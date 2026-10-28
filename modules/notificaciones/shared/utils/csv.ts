/** @format */

/** Resultado de leer destinatarios de un CSV o de texto pegado. */
export interface FilaDestinatario {
  /** Número de línea en el archivo (1 = primera línea de datos). */
  linea: number;
  destino: string;
  nombre?: string;
  indicativo?: string;
  referencia?: string;
  variables: Record<string, string>;
  error?: string;
}

export interface LecturaDestinatarios {
  filas: FilaDestinatario[];
  /** Columnas que se usan como variables de plantilla. */
  columnasVariables: string[];
  conEncabezado: boolean;
}

/** Separa una línea CSV respetando comillas ("a, b" o "a ""b"""). */
function partir(linea: string, sep: string): string[] {
  const out: string[] = [];
  let actual = '';
  let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (comillas) {
      if (c === '"' && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else if (c === '"') comillas = false;
      else actual += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) {
      out.push(actual.trim());
      actual = '';
    } else actual += c;
  }
  out.push(actual.trim());
  return out;
}

const normalizar = (s: string) =>
  s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_');

/**
 * Lee destinatarios de texto CSV (separador , ; o tabulador, detectado en la primera línea) o de una lista simple
 * (un destino por línea). Con encabezado, la columna de destino se reconoce por nombre (`destinoColumnas`), `nombre`,
 * `indicativo`/`pais` y `referencia` son reservadas y el resto son variables de plantilla.
 */
export function leerDestinatarios(
  texto: string,
  opciones: { destinoColumnas: string[]; esDestinoValido: (v: string) => boolean; normalizarDestino?: (v: string) => string },
): LecturaDestinatarios {
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lineas.length === 0) return { filas: [], columnasVariables: [], conEncabezado: false };
  const primera = lineas[0] ?? '';
  const sep = primera.includes('\t') ? '\t' : (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ';' : ',';
  const norm = opciones.normalizarDestino ?? ((v: string) => v.trim());
  const celdas0 = partir(primera, sep);
  const conEncabezado = !opciones.esDestinoValido(norm(celdas0[0] ?? ''));

  if (!conEncabezado) {
    // Lista simple: primera columna = destino, segunda (opcional) = nombre
    const filas = lineas.map((l, i) => {
      const c = partir(l, sep);
      const destino = norm(c[0] ?? '');
      return {
        linea: i + 1,
        destino,
        nombre: c[1] || undefined,
        variables: {},
        error: opciones.esDestinoValido(destino) ? undefined : 'Destino inválido',
      };
    });
    return { filas: marcarDuplicados(filas), columnasVariables: [], conEncabezado };
  }

  const encabezado = celdas0.map(normalizar);
  const iDestino = encabezado.findIndex((h) => opciones.destinoColumnas.includes(h));
  const iNombre = encabezado.indexOf('nombre');
  const iIndicativo = encabezado.findIndex((h) => ['indicativo', 'pais', 'country_code', 'codigo_pais'].includes(h));
  const iReferencia = encabezado.indexOf('referencia');
  const reservadas = new Set([iDestino, iIndicativo, iReferencia]);
  const columnasVariables = encabezado.filter((h, i) => !reservadas.has(i) && h);

  const filas = lineas.slice(1).map((l, i) => {
    const c = partir(l, sep);
    const destino = iDestino >= 0 ? norm(c[iDestino] ?? '') : '';
    const variables: Record<string, string> = {};
    encabezado.forEach((h, j) => {
      if (!reservadas.has(j) && h && c[j] !== undefined && c[j] !== '') variables[h] = c[j];
    });
    let error: string | undefined;
    if (iDestino < 0) error = `Falta la columna ${opciones.destinoColumnas[0]}`;
    else if (!opciones.esDestinoValido(destino)) error = 'Destino inválido';
    return {
      linea: i + 1,
      destino,
      nombre: iNombre >= 0 ? c[iNombre] || undefined : undefined,
      indicativo: iIndicativo >= 0 ? c[iIndicativo] || undefined : undefined,
      referencia: iReferencia >= 0 ? c[iReferencia] || undefined : undefined,
      variables,
      error,
    };
  });
  return { filas: marcarDuplicados(filas), columnasVariables, conEncabezado };
}

function marcarDuplicados(filas: FilaDestinatario[]): FilaDestinatario[] {
  const vistos = new Set<string>();
  return filas.map((f) => {
    if (f.error) return f;
    const clave = f.destino.toLowerCase();
    if (vistos.has(clave)) return { ...f, error: 'Duplicado' };
    vistos.add(clave);
    return f;
  });
}

/** CSV de ejemplo para descargar. */
export function descargarCsv(nombre: string, contenido: string) {
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
