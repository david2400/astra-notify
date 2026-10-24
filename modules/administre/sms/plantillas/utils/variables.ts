/** @format */

/** Variables {{nombre}} usadas en el contenido, en orden de aparición y sin repetir. */
export function variablesDelContenido(contenido: string): string[] {
  const vistos = new Set<string>();
  for (const m of contenido.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g)) {
    if (m[1]) vistos.add(m[1]);
  }
  return [...vistos];
}
