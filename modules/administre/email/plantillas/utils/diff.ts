/** @format */

export type LineaDiff = { tipo: 'igual' | 'agregada' | 'eliminada'; texto: string; a?: number; b?: number };

/** Límite de celdas de la tabla LCS (filas × columnas) para no bloquear el navegador. */
const MAX_CELDAS = 4_000_000;

/** Parte HTML en líneas legibles (una etiqueta por línea) para poder compararlo. */
export function lineasHtml(html: string | null | undefined): string[] {
  if (!html) return [];
  return html
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export function lineasTexto(texto: string | null | undefined): string[] {
  return texto ? texto.replace(/\r\n?/g, '\n').split('\n') : [];
}

/**
 * Diferencia por líneas (LCS). Recorta prefijo y sufijo comunes antes de calcular, así que versiones grandes con
 * pocos cambios son baratas. Si aun así es demasiado grande devuelve null (se muestra solo el resumen).
 */
export function diffLineas(a: string[], b: string[]): LineaDiff[] | null {
  let ini = 0;
  while (ini < a.length && ini < b.length && a[ini] === b[ini]) ini++;
  let finA = a.length;
  let finB = b.length;
  while (finA > ini && finB > ini && a[finA - 1] === b[finB - 1]) {
    finA--;
    finB--;
  }
  const ma = a.slice(ini, finA);
  const mb = b.slice(ini, finB);
  const n = ma.length;
  const m = mb.length;
  if ((n + 1) * (m + 1) > MAX_CELDAS) return null;

  const ancho = m + 1;
  const t = new Uint32Array((n + 1) * ancho);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      t[i * ancho + j] = ma[i] === mb[j] ? t[(i + 1) * ancho + j + 1]! + 1 : Math.max(t[(i + 1) * ancho + j]!, t[i * ancho + j + 1]!);
    }
  }

  const out: LineaDiff[] = [];
  for (let k = 0; k < ini; k++) out.push({ tipo: 'igual', texto: a[k]!, a: k + 1, b: k + 1 });
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && ma[i] === mb[j]) {
      out.push({ tipo: 'igual', texto: ma[i]!, a: ini + i + 1, b: ini + j + 1 });
      i++;
      j++;
    } else if (i < n && (j >= m || t[(i + 1) * ancho + j]! >= t[i * ancho + j + 1]!)) {
      out.push({ tipo: 'eliminada', texto: ma[i]!, a: ini + i + 1 });
      i++;
    } else {
      out.push({ tipo: 'agregada', texto: mb[j]!, b: ini + j + 1 });
      j++;
    }
  }
  for (let k = 0; k < a.length - finA; k++) out.push({ tipo: 'igual', texto: a[finA + k]!, a: finA + k + 1, b: finB + k + 1 });
  return out;
}

/** Deja solo los cambios con `contexto` líneas alrededor; los tramos iguales largos se resumen. */
export function conContexto(lineas: LineaDiff[], contexto = 2): (LineaDiff | { tipo: 'salto'; ocultas: number })[] {
  const visible = lineas.map(() => false);
  lineas.forEach((l, idx) => {
    if (l.tipo === 'igual') return;
    for (let k = Math.max(0, idx - contexto); k <= Math.min(lineas.length - 1, idx + contexto); k++) visible[k] = true;
  });
  const out: (LineaDiff | { tipo: 'salto'; ocultas: number })[] = [];
  let ocultas = 0;
  lineas.forEach((l, idx) => {
    if (visible[idx]) {
      if (ocultas) out.push({ tipo: 'salto', ocultas });
      ocultas = 0;
      out.push(l);
    } else ocultas++;
  });
  if (ocultas) out.push({ tipo: 'salto', ocultas });
  return out;
}
