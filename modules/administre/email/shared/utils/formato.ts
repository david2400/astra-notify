/** @format */

/** Fecha ISO del gateway (UTC) → texto local corto. */
export function fechaCorta(iso?: string | null): string {
  if (!iso) return '--';
  const fecha = new Date(iso.includes('T') || iso.endsWith('Z') ? iso : `${iso.replace(' ', 'T')}Z`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });
}
