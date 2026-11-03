/** @format */

/**
 * Prepara una imagen para correo en el navegador antes de subirla: la redimensiona a un ancho máximo (1200 px = 600 px
 * del correo en pantallas retina) y la comprime. Los GIF no se tocan (perderían la animación). Formatos que los
 * clientes de correo no muestran bien (WebP, BMP, AVIF...) se convierten a PNG o JPG si el navegador los puede leer.
 */

export const MAX_ANCHO = 1200;
export const CALIDAD_JPEG = 0.85;
/** Límite del backend (notificacion.imagenes.max-bytes por defecto). */
export const MAX_BYTES = 5 * 1024 * 1024;
export const TIPOS_DIRECTOS = ['image/png', 'image/jpeg', 'image/gif'];

export interface ImagenOptimizada {
  archivo: File;
  bytesOriginal: number;
  ancho: number;
  alto: number;
  /** Se redimensionó o recomprimió. */
  optimizada: boolean;
}

const nombreCon = (nombre: string, ext: string) => `${nombre.replace(/\.[^.]+$/, '') || 'imagen'}.${ext}`;

function lienzo(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const aBlob = (c: HTMLCanvasElement, tipo: string, calidad?: number) =>
  new Promise<Blob>((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo procesar la imagen'))), tipo, calidad));

/** ¿Tiene píxeles transparentes? (muestra reducida para que sea rápido). */
function tieneTransparencia(bmp: ImageBitmap): boolean {
  const escala = Math.min(1, 256 / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * escala));
  const h = Math.max(1, Math.round(bmp.height * escala));
  const ctx = lienzo(w, h).getContext('2d', { willReadFrequently: true });
  if (!ctx) return true;
  ctx.drawImage(bmp, 0, 0, w, h);
  const datos = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < datos.length; i += 4) if (datos[i]! < 250) return true;
  return false;
}

export async function optimizarImagen(file: File, maxAncho = MAX_ANCHO): Promise<ImagenOptimizada> {
  if (file.type === 'image/gif') {
    if (file.size > MAX_BYTES) throw new Error(`El GIF pesa ${(file.size / 1048576).toFixed(1)} MB (máximo 5 MB). Redúcelo antes de subirlo.`);
    const bmp = await createImageBitmap(file).catch(() => null);
    const r = { archivo: file, bytesOriginal: file.size, ancho: bmp?.width ?? 0, alto: bmp?.height ?? 0, optimizada: false };
    bmp?.close();
    return r;
  }
  if (file.type === 'image/svg+xml') throw new Error('SVG no se muestra en Gmail ni Outlook: expórtalo como PNG.');
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error('No se pudo leer la imagen (¿formato no soportado o archivo dañado?).');
  }
  try {
    const escala = Math.min(1, maxAncho / bmp.width);
    const w = Math.max(1, Math.round(bmp.width * escala));
    const h = Math.max(1, Math.round(bmp.height * escala));
    const directo = TIPOS_DIRECTOS.includes(file.type);
    // Sin cambios si ya es liviana, del tamaño correcto y en un formato de correo
    if (directo && escala === 1 && file.size <= 200 * 1024) {
      return { archivo: file, bytesOriginal: file.size, ancho: bmp.width, alto: bmp.height, optimizada: false };
    }
    const c = lienzo(w, h);
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('El navegador no permite procesar imágenes');
    ctx.imageSmoothingQuality = 'high';
    const alfa = file.type !== 'image/jpeg' && tieneTransparencia(bmp);
    if (!alfa) {
      // JPG no tiene transparencia: fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(bmp, 0, 0, w, h);
    const candidatos: { blob: Blob; tipo: string; ext: string }[] = [];
    if (alfa) candidatos.push({ blob: await aBlob(c, 'image/png'), tipo: 'image/png', ext: 'png' });
    else {
      candidatos.push({ blob: await aBlob(c, 'image/jpeg', CALIDAD_JPEG), tipo: 'image/jpeg', ext: 'jpg' });
      // PNG sin transparencia (logos, capturas planas): a veces pesa menos que el JPG y se ve más nítido
      if (file.type === 'image/png') candidatos.push({ blob: await aBlob(c, 'image/png'), tipo: 'image/png', ext: 'png' });
    }
    const mejor = candidatos.reduce((a, b) => (b.blob.size < a.blob.size ? b : a));
    // Si no se redimensionó y el original en formato de correo ya pesa menos, se deja el original
    if (directo && escala === 1 && file.size <= mejor.blob.size) {
      return { archivo: file, bytesOriginal: file.size, ancho: bmp.width, alto: bmp.height, optimizada: false };
    }
    if (mejor.blob.size > MAX_BYTES) throw new Error('La imagen sigue pesando más de 5 MB después de optimizarla.');
    return {
      archivo: new File([mejor.blob], nombreCon(file.name, mejor.ext), { type: mejor.tipo }),
      bytesOriginal: file.size,
      ancho: w,
      alto: h,
      optimizada: true,
    };
  } finally {
    bmp.close();
  }
}

export function formatoBytes(n: number): string {
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** Ancho (%) de una imagen en el correo (contenido de ~552 px): las pequeñas no se estiran. */
export function anchoEnCorreo(anchoPx?: number | null, contenedor = 552): number {
  return anchoPx && anchoPx < contenedor ? Math.max(10, Math.round((anchoPx / contenedor) * 100)) : 100;
}
