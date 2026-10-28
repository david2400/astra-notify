/** @format */

/** Lee un archivo del navegador como Base64 (sin el prefijo data:). */
export function leerBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = String(lector.result ?? '');
      resolve(resultado.slice(resultado.indexOf(',') + 1));
    };
    lector.onerror = () => reject(lector.error ?? new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}

export function leerTexto(archivo: File): Promise<string> {
  return archivo.text();
}

export const tamano = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;

/** Clave de idempotencia por envío (evita duplicados por doble clic o reintentos de red). */
export const nuevaClave = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** datetime-local (hora local) → ISO UTC. */
export const localAIso = (local: string) => (local ? new Date(local).toISOString() : undefined);

/** Fecha de los gateways (UTC con o sin Z) → texto local. */
export function fechaLocal(valor?: string | null): string {
  if (!valor) return '--';
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(valor) ? valor : `${valor.replace(' ', 'T')}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });
}
