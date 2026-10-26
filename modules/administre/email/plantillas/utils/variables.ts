/** @format */

const PATRON = /(?<!\\)\{\{\s*([a-zA-Z][a-zA-Z0-9_]{0,49})\s*\}\}/g;

/** Variables {{nombre}} usadas en un texto, en orden de aparición y sin repetir (ignora \{{ escapado). */
export function variablesDe(texto: string | null | undefined): string[] {
  const vistos = new Set<string>();
  for (const m of (texto ?? '').matchAll(PATRON)) {
    if (m[1]) vistos.add(m[1]);
  }
  return [...vistos];
}

/** Variables usadas en asunto, HTML y texto. */
export function variablesDePlantilla(asunto: string, html: string, texto: string): string[] {
  return [...new Set([...variablesDe(asunto), ...variablesDe(html), ...variablesDe(texto)])];
}

const escapar = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Sustituye variables por sus valores para la vista previa local. En HTML los valores se escapan (igual
 * que el gateway); las variables sin valor quedan visibles como {{nombre}}.
 */
export function aplicarVariables(texto: string, valores: Record<string, string>, html = false): string {
  return (texto ?? '')
    .replace(PATRON, (token, nombre: string) => {
      const valor = valores[nombre];
      if (!valor) return token;
      return html ? escapar(valor) : valor;
    })
    .replace(/\\\{\{/g, '{{');
}
