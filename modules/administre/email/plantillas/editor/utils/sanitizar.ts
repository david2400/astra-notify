/** @format */

/**
 * Limpieza del HTML de los bloques de texto (contentEditable). Solo deja formato en línea: negrita, cursiva,
 * subrayado, tachado, enlaces, listas, saltos de línea y color/alineación. Quita scripts, eventos y estilos
 * arbitrarios. Requiere DOM (se usa solo en el navegador); sin DOM escapa el texto.
 */

const ETIQUETAS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'A', 'BR', 'P', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'FONT', 'SUB', 'SUP']);
const BLOQUE = new Set(['P', 'DIV', 'LI', 'UL', 'OL']);
const ESTILOS = new Set(['color', 'background-color', 'font-weight', 'font-style', 'text-decoration', 'text-align']);

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** URL segura para href/src: http(s), mailto, tel, ancla o una variable {{...}}. */
export function urlSegura(url: string | null | undefined): string {
  const u = (url ?? '').trim();
  if (!u || /^(https?:\/\/|www\.?)$/i.test(u)) return '';
  if (/^\{\{\s*[a-zA-Z][a-zA-Z0-9_]*\s*\}\}/.test(u)) return u;
  if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
  return u.startsWith('www.') ? `https://${u}` : u;
}

function limpiarEstilo(estilo: string): string {
  return estilo
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const i = r.indexOf(':');
      if (i < 0) return null;
      const prop = r.slice(0, i).trim().toLowerCase();
      const valor = r.slice(i + 1).trim();
      if (!ESTILOS.has(prop) || /url\(|expression|javascript:|[<>"]/i.test(valor)) return null;
      return `${prop}:${valor}`;
    })
    .filter(Boolean)
    .join(';');
}

function serializar(nodo: Node, enlace: string | null): string {
  if (nodo.nodeType === Node.TEXT_NODE) return escapar(nodo.textContent ?? '');
  if (nodo.nodeType !== Node.ELEMENT_NODE) return '';
  const el = nodo as Element;
  const tag = el.tagName.toUpperCase();
  const hijos = Array.from(el.childNodes).map((n) => serializar(n, enlace)).join('');
  if (!ETIQUETAS.has(tag)) return BLOQUE.has(tag) ? `<div>${hijos}</div>` : hijos;
  if (tag === 'BR') return '<br>';
  if (tag === 'FONT') {
    const color = el.getAttribute('color');
    return color && /^#?[\w]+$/.test(color) ? `<span style="color:${escapar(color)}">${hijos}</span>` : hijos;
  }
  const attrs: string[] = [];
  if (tag === 'A') {
    const href = urlSegura(el.getAttribute('href'));
    if (!href) return hijos;
    attrs.push(`href="${escapar(href)}"`, 'target="_blank"', 'rel="noopener"');
  }
  let estilo = limpiarEstilo(el.getAttribute('style') ?? '');
  const align = el.getAttribute('align');
  if (align && /^(left|center|right|justify)$/i.test(align)) estilo = `${estilo ? `${estilo};` : ''}text-align:${align.toLowerCase()}`;
  if (tag === 'A' && enlace) estilo = `color:${enlace};text-decoration:underline${estilo ? `;${estilo}` : ''}`;
  if (tag === 'P') estilo = `margin:0 0 12px 0${estilo ? `;${estilo}` : ''}`;
  if (tag === 'UL' || tag === 'OL') estilo = `margin:0 0 12px 0;padding-left:24px${estilo ? `;${estilo}` : ''}`;
  if (estilo) attrs.push(`style="${escapar(estilo)}"`);
  const t = tag.toLowerCase();
  return `<${t}${attrs.length ? ` ${attrs.join(' ')}` : ''}>${hijos}</${t}>`;
}

/**
 * HTML seguro de un bloque de texto.
 * @param colorEnlace si se indica, los enlaces llevan ese color en línea (clientes que ignoran <style>).
 */
export function sanitizarHtmlTexto(html: string, colorEnlace: string | null = null): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return escapar(html.replace(/<[^>]*>/g, ''));
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const raiz = doc.body.firstElementChild;
  if (!raiz) return '';
  return Array.from(raiz.childNodes).map((n) => serializar(n, colorEnlace)).join('');
}

/** Texto plano de un fragmento HTML (para la versión de texto del correo). */
export function htmlATexto(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, '');
  const doc = new DOMParser().parseFromString(
    `<div>${html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6])>/gi, '\n')}</div>`,
    'text/html',
  );
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    if (href && href !== a.textContent?.trim()) a.textContent = `${a.textContent ?? ''} (${href})`;
  });
  doc.querySelectorAll('li').forEach((li) => (li.textContent = `• ${li.textContent ?? ''}`));
  return (doc.body.textContent ?? '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
