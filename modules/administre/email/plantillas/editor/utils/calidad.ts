/** @format */

/**
 * Validación de calidad antes de enviar (en el navegador): tamaño (recorte de Gmail), imágenes sin texto alternativo,
 * enlaces vacíos o inseguros, contraste del texto, palabras que activan filtros antispam, asunto y texto plano.
 * Son recomendaciones: solo "error" indica algo que casi seguro se verá mal o se marcará como spam.
 */

export type NivelCalidad = 'ok' | 'info' | 'aviso' | 'error';
export type CategoriaCalidad = 'Entrega' | 'Contenido' | 'Accesibilidad' | 'Enlaces' | 'Asunto';

export interface ItemCalidad {
  id: string;
  categoria: CategoriaCalidad;
  nivel: NivelCalidad;
  titulo: string;
  detalle?: string;
  /** Ejemplos concretos (máx. 5). */
  ejemplos?: string[];
}

export interface ResultadoCalidad {
  items: ItemCalidad[];
  /** 0–100: resta 15 por error y 5 por aviso. */
  puntuacion: number;
  bytesHtml: number;
  /** URLs http(s) absolutas sin variables (las que se pueden verificar). */
  enlacesVerificables: string[];
}

/** Gmail recorta mensajes cuyo HTML supera ~102 KB ("[Mensaje recortado]"), y oculta el pie y el enlace de baja. */
export const LIMITE_GMAIL = 102 * 1024;

const SPAM = [
  'gratis', '100% gratis', 'totalmente gratis', 'sin costo', 'dinero fácil', 'gana dinero', 'ganaste', 'has ganado', 'ganador',
  'felicidades', 'premio', 'oferta exclusiva', 'oferta por tiempo limitado', 'última oportunidad', 'actúa ahora', 'urgente',
  'haz clic aquí', 'clic aquí', 'click aquí', 'compra ahora', 'sin riesgo', 'garantizado', 'crédito aprobado', 'préstamo inmediato',
  'free', 'winner', 'act now', 'click here', 'buy now', 'limited time', 'risk free', 'guaranteed', 'cash', 'viagra', 'casino',
];

const textoDe = (s: string) => s.replace(/\{\{\s*[a-zA-Z][a-zA-Z0-9_]*\s*\}\}/g, ' ').replace(/\s+/g, ' ').trim();
const corto = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const tieneVariable = (s: string) => /\{\{\s*[a-zA-Z][a-zA-Z0-9_]*\s*\}\}/.test(s);

/* ---------- Colores y contraste (WCAG 2.1) ---------- */

type Rgb = [number, number, number];

export function parseColor(valor: string | null | undefined): Rgb | null {
  if (!valor) return null;
  const v = valor.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(v);
  if (m) return [0, 1, 2].map((i) => parseInt(m![1]![i]! + m![1]![i]!, 16)) as Rgb;
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(v);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1]!.slice(i, i + 2), 16)) as Rgb;
  m = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/.exec(v);
  if (m) {
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null; // transparente
    return [Number(m[1]), Number(m[2]), Number(m[3])].map((x) => Math.min(255, x)) as Rgb;
  }
  if (v === 'white') return [255, 255, 255];
  if (v === 'black') return [0, 0, 0];
  return null;
}

const luminancia = ([r, g, b]: Rgb) => {
  const c = [r, g, b].map((x) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};

export function contraste(a: Rgb, b: Rgb): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
}

const estilo = (el: Element, prop: string): string | null => {
  const s = el.getAttribute('style');
  if (!s) return null;
  const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i');
  return re.exec(s)?.[1]?.replace(/!important/i, '').trim() ?? null;
};

const fondoDe = (el: Element | null): Rgb => {
  for (let e = el; e; e = e.parentElement) {
    const bg = parseColor(estilo(e, 'background-color')) ?? parseColor(estilo(e, 'background')?.split(/\s+/)[0]) ?? parseColor(e.getAttribute('bgcolor'));
    if (bg) return bg;
  }
  return [255, 255, 255];
};

const colorDe = (el: Element | null): Rgb => {
  for (let e = el; e; e = e.parentElement) {
    const c = parseColor(estilo(e, 'color'));
    if (c) return c;
    if (e.tagName === 'FONT') {
      const f = parseColor(e.getAttribute('color'));
      if (f) return f;
    }
  }
  return [0, 0, 0];
};

const textoGrande = (el: Element) => {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const fs = estilo(e, 'font-size');
    if (fs) {
      const px = /([\d.]+)px/.exec(fs);
      const peso = estilo(el, 'font-weight') ?? '';
      if (!px) return false;
      const n = parseFloat(px[1]!);
      return n >= 24 || (n >= 18.66 && (/bold|[6-9]00/.test(peso) || /^H[1-3]$/.test(el.tagName)));
    }
    if (/^H[1-2]$/.test(e.tagName)) return true;
  }
  return false;
};

/* ---------- Análisis ---------- */

export function analizarCalidad({ asunto, html, texto, tipoMensaje }: { asunto: string; html: string; texto: string; tipoMensaje?: string | null }): ResultadoCalidad {
  const items: ItemCalidad[] = [];
  const add = (i: ItemCalidad) => items.push({ ...i, ejemplos: i.ejemplos?.slice(0, 5) });
  const bytesHtml = new TextEncoder().encode(html).length;
  const masivo = /MASIV|MARKET|PROMO|NEWS|BOLETIN|CAMPA/i.test(tipoMensaje ?? '');

  /* Asunto */
  const a = asunto.trim();
  const letras = a.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
  if (!a) add({ id: 'asunto-vacio', categoria: 'Asunto', nivel: 'error', titulo: 'El asunto está vacío' });
  else {
    const largo = textoDe(a).length;
    add(
      largo > 78
        ? { id: 'asunto-largo', categoria: 'Asunto', nivel: 'aviso', titulo: `Asunto largo (${largo} caracteres)`, detalle: 'En móvil se ven unos 40–50 caracteres; lo importante debe ir al inicio.' }
        : largo < 8
          ? { id: 'asunto-corto', categoria: 'Asunto', nivel: 'aviso', titulo: 'Asunto muy corto', detalle: 'Un asunto descriptivo mejora la apertura y evita filtros.' }
          : { id: 'asunto-largo', categoria: 'Asunto', nivel: 'ok', titulo: `Longitud del asunto adecuada (${largo})` },
    );
    if (letras.length >= 8 && letras.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length / letras.length > 0.6)
      add({ id: 'asunto-mayus', categoria: 'Asunto', nivel: 'aviso', titulo: 'Asunto en MAYÚSCULAS', detalle: 'Los filtros antispam penalizan asuntos en mayúsculas.' });
    if (/[!?¡¿]{2,}|\${2,}|%{2,}/.test(a)) add({ id: 'asunto-signos', categoria: 'Asunto', nivel: 'aviso', titulo: 'Signos repetidos en el asunto (!!, ??, $$)' });
    if (/^\s*(re|fw|fwd|rv)\s*:/i.test(a)) add({ id: 'asunto-re', categoria: 'Asunto', nivel: 'aviso', titulo: 'El asunto simula una respuesta (RE:/FW:)', detalle: 'Es engañoso y suele marcarse como spam.' });
  }

  /* Tamaño */
  add(
    bytesHtml > LIMITE_GMAIL
      ? { id: 'tamano', categoria: 'Entrega', nivel: 'error', titulo: `HTML de ${(bytesHtml / 1024).toFixed(0)} KB: Gmail lo recortará`, detalle: 'Gmail corta el mensaje a partir de ~102 KB y oculta el pie (y el enlace de baja). Reduce bloques o estilos.' }
      : bytesHtml > 80 * 1024
        ? { id: 'tamano', categoria: 'Entrega', nivel: 'aviso', titulo: `HTML de ${(bytesHtml / 1024).toFixed(0)} KB, cerca del límite de Gmail (102 KB)` }
        : { id: 'tamano', categoria: 'Entrega', nivel: 'ok', titulo: `Tamaño del HTML: ${(bytesHtml / 1024).toFixed(1)} KB` },
  );

  /* Texto plano */
  add(
    texto.trim()
      ? { id: 'texto-plano', categoria: 'Entrega', nivel: 'ok', titulo: 'Incluye versión de texto plano' }
      : { id: 'texto-plano', categoria: 'Entrega', nivel: 'aviso', titulo: 'Sin versión de texto plano', detalle: 'Los mensajes solo HTML puntúan peor en filtros antispam.' },
  );

  const enlaces: string[] = [];
  if (html.trim() && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = doc.body;
    doc.querySelectorAll('script,style,noscript').forEach((n) => n.remove());

    /* Imágenes */
    const imgs = [...body.querySelectorAll('img')];
    const sinAlt = imgs.filter((i) => !i.hasAttribute('alt'));
    const srcInseguro = imgs.filter((i) => /^http:\/\//i.test(i.getAttribute('src') ?? ''));
    const dataUri = imgs.filter((i) => /^data:/i.test(i.getAttribute('src') ?? ''));
    const sinSrc = imgs.filter((i) => !(i.getAttribute('src') ?? '').trim());
    if (imgs.length) {
      add(
        sinAlt.length
          ? { id: 'img-alt', categoria: 'Accesibilidad', nivel: 'aviso', titulo: `${sinAlt.length} imagen(es) sin texto alternativo`, detalle: 'Muchos clientes bloquean imágenes por defecto: el texto alternativo es lo que se ve.', ejemplos: sinAlt.map((i) => corto(i.getAttribute('src') ?? '(sin src)')) }
          : { id: 'img-alt', categoria: 'Accesibilidad', nivel: 'ok', titulo: 'Todas las imágenes tienen texto alternativo' },
      );
    }
    if (sinSrc.length) add({ id: 'img-src', categoria: 'Contenido', nivel: 'error', titulo: `${sinSrc.length} imagen(es) sin URL` });
    if (srcInseguro.length) add({ id: 'img-http', categoria: 'Contenido', nivel: 'aviso', titulo: 'Imágenes por http:// (no seguro)', detalle: 'Algunos clientes no las cargan; usa https://.', ejemplos: srcInseguro.map((i) => corto(i.getAttribute('src')!)) });
    if (dataUri.length) add({ id: 'img-data', categoria: 'Entrega', nivel: 'aviso', titulo: 'Imágenes incrustadas (data:)', detalle: 'Gmail y Outlook no muestran imágenes en base64 y aumentan el tamaño. Súbelas a un servidor.' });

    /* Proporción texto / imagen */
    const visible = textoDe(body.textContent ?? '');
    if (imgs.length && visible.length < 200)
      add({ id: 'ratio', categoria: 'Entrega', nivel: 'aviso', titulo: 'Correo mayormente de imágenes', detalle: `Solo ${visible.length} caracteres de texto. Los filtros desconfían de correos que son casi solo imágenes.` });

    /* Enlaces */
    const as = [...body.querySelectorAll('a')];
    const vacios = as.filter((x) => {
      const h = (x.getAttribute('href') ?? '').trim();
      return !h || h === '#' || /^javascript:/i.test(h) || /^https?:\/\/?$/i.test(h);
    });
    const http = as.filter((x) => /^http:\/\//i.test(x.getAttribute('href') ?? ''));
    const sinTexto = as.filter((x) => !textoDe(x.textContent ?? '') && !x.querySelector('img[alt]:not([alt=""])'));
    const genericos = as.filter((x) => /^(clic|click|haz clic|aquí|aqui|here|click here|ver más|leer más)$/i.test(textoDe(x.textContent ?? '')));
    if (as.length) {
      add(
        vacios.length
          ? { id: 'link-vacio', categoria: 'Enlaces', nivel: 'error', titulo: `${vacios.length} enlace(s) vacíos o "#"`, detalle: 'Configura la URL de cada botón o enlace.', ejemplos: vacios.map((x) => corto(textoDe(x.textContent ?? '') || '(sin texto)')) }
          : { id: 'link-vacio', categoria: 'Enlaces', nivel: 'ok', titulo: `${as.length} enlace(s) con destino` },
      );
    }
    if (http.length) add({ id: 'link-http', categoria: 'Enlaces', nivel: 'aviso', titulo: 'Enlaces http:// (no seguros)', ejemplos: http.map((x) => corto(x.getAttribute('href')!)) });
    if (sinTexto.length) add({ id: 'link-texto', categoria: 'Accesibilidad', nivel: 'aviso', titulo: `${sinTexto.length} enlace(s) sin texto ni imagen con alt` });
    if (genericos.length) add({ id: 'link-generico', categoria: 'Accesibilidad', nivel: 'info', titulo: 'Enlaces con texto genérico ("clic aquí")', detalle: 'Describe el destino ("Ver mi factura"): mejora accesibilidad y entrega.' });
    as.forEach((x) => {
      const h = (x.getAttribute('href') ?? '').trim();
      if (/^https?:\/\/[^\s]+$/i.test(h) && !tieneVariable(h) && !enlaces.includes(h)) enlaces.push(h);
    });
    const conVariable = as.filter((x) => tieneVariable(x.getAttribute('href') ?? '')).length;
    if (conVariable) add({ id: 'link-variable', categoria: 'Enlaces', nivel: 'info', titulo: `${conVariable} enlace(s) con variables`, detalle: 'Se resuelven al enviar: verifícalos con un envío de prueba.' });

    /* Baja */
    const baja = /baja|unsubscribe|desuscrib|darse de baja|cancelar (la )?suscripci|dejar de recibir/i.test(visible) || as.some((x) => /baja|unsubscribe/i.test(x.getAttribute('href') ?? ''));
    if (!baja)
      add({
        id: 'baja',
        categoria: 'Entrega',
        nivel: masivo ? 'error' : 'info',
        titulo: 'Sin enlace para darse de baja',
        detalle: masivo ? 'Los correos masivos deben permitir darse de baja (Gmail/Yahoo lo exigen a remitentes masivos).' : 'Obligatorio en correos masivos o de marketing; opcional en transaccionales.',
      });

    /* Contraste */
    const bajos: string[] = [];
    let revisados = 0;
    body.querySelectorAll('p,span,a,td,h1,h2,h3,h4,li,div,strong,em,font').forEach((el) => {
      const propio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      if (!propio || revisados > 400) return;
      revisados++;
      const ratio = contraste(colorDe(el), fondoDe(el));
      const minimo = textoGrande(el) ? 3 : 4.5;
      if (ratio < minimo) bajos.push(`${ratio.toFixed(1)}:1 · "${corto(textoDe(el.textContent ?? ''), 40)}"`);
    });
    if (revisados) {
      add(
        bajos.length
          ? { id: 'contraste', categoria: 'Accesibilidad', nivel: 'aviso', titulo: `${bajos.length} texto(s) con contraste bajo`, detalle: 'WCAG AA pide 4.5:1 (3:1 en textos grandes). Con poco contraste cuesta leer, sobre todo en móvil.', ejemplos: bajos }
          : { id: 'contraste', categoria: 'Accesibilidad', nivel: 'ok', titulo: 'Contraste de texto adecuado' },
      );
    }

    /* Antispam */
    const todo = `${a} ${visible}`.toLowerCase();
    const encontradas = SPAM.filter((p) => new RegExp(`(^|[^\\p{L}])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u').test(todo));
    add(
      encontradas.length >= 3
        ? { id: 'spam', categoria: 'Entrega', nivel: 'aviso', titulo: `${encontradas.length} expresiones típicas de spam`, ejemplos: encontradas }
        : encontradas.length
          ? { id: 'spam', categoria: 'Entrega', nivel: 'info', titulo: 'Expresiones que algunos filtros penalizan', ejemplos: encontradas }
          : { id: 'spam', categoria: 'Entrega', nivel: 'ok', titulo: 'Sin expresiones típicas de spam' },
    );
    if (/[A-ZÁÉÍÓÚÑ]{4,}(\s+[A-ZÁÉÍÓÚÑ]{4,}){3,}/.test(visible))
      add({ id: 'mayus', categoria: 'Entrega', nivel: 'info', titulo: 'Frases largas en MAYÚSCULAS en el cuerpo' });
  } else if (!html.trim()) {
    add({ id: 'sin-html', categoria: 'Contenido', nivel: texto.trim() ? 'info' : 'error', titulo: 'Sin cuerpo HTML', detalle: texto.trim() ? 'Se enviará solo texto plano.' : undefined });
  }

  const errores = items.filter((i) => i.nivel === 'error').length;
  const avisos = items.filter((i) => i.nivel === 'aviso').length;
  const orden: Record<NivelCalidad, number> = { error: 0, aviso: 1, info: 2, ok: 3 };
  items.sort((x, y) => orden[x.nivel] - orden[y.nivel]);
  return { items, puntuacion: Math.max(0, 100 - errores * 15 - avisos * 5), bytesHtml, enlacesVerificables: enlaces.slice(0, 40) };
}
