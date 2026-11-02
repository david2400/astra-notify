/** @format */

import {
  ANCHOS_DISTRIBUCION,
  REDES,
  type AjustesDiseno,
  type Bloque,
  type BloqueColumnas,
  type BloqueSimple,
  type Diseno,
} from '../models/diseno';
import { htmlATexto, sanitizarHtmlTexto, urlSegura } from './sanitizar';

/**
 * Genera HTML de email "a prueba de clientes de correo": maquetación con tablas, estilos en línea, ancho fijo en
 * escritorio y columnas que se apilan en móvil (media query). Las variables {{nombre}} quedan tal cual: el gateway
 * las reemplaza (y escapa) al enviar.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Atributo: escapa comillas y < > pero deja las variables {{...}} intactas. */
const attr = (s: string) => esc(s);
const color = (c: string, defecto: string) => (/^#[0-9a-fA-F]{3,8}$|^rgba?\([\d\s.,%]+\)$|^[a-zA-Z]+$/.test(c ?? '') ? c : defecto);
const num = (n: number, min: number, max: number, defecto: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : defecto);

const TAMANO_TITULO: Record<1 | 2 | 3, number> = { 1: 28, 2: 22, 3: 18 };

function contenidoBloque(b: BloqueSimple, a: AjustesDiseno, anchoDisponible: number): string {
  switch (b.tipo) {
    case 'encabezado': {
      const t = TAMANO_TITULO[b.nivel] ?? 22;
      return `<h${b.nivel} style="margin:0;font-family:${a.fuente};font-size:${t}px;line-height:1.3;font-weight:700;color:${color(b.color, a.colorTexto)};text-align:${b.alineacion}">${sanitizarHtmlTexto(b.html, a.colorEnlace)}</h${b.nivel}>`;
    }
    case 'texto': {
      const tam = b.tamano > 0 ? b.tamano : a.tamanoBase;
      return `<div style="font-family:${a.fuente};font-size:${num(tam, 10, 40, 16)}px;line-height:${num(b.interlineado, 1, 3, 1.6)};color:${color(b.color, a.colorTexto)};text-align:${b.alineacion}">${sanitizarHtmlTexto(b.html, a.colorEnlace)}</div>`;
    }
    case 'pie':
      return `<div style="font-family:${a.fuente};font-size:${num(b.tamano, 10, 20, 12)}px;line-height:1.6;color:${color(b.color, '#64748b')};text-align:${b.alineacion}">${sanitizarHtmlTexto(b.html, color(b.color, a.colorEnlace))}</div>`;
    case 'imagen': {
      const src = urlSegura(b.url);
      if (!src) return '';
      const ancho = Math.round((anchoDisponible * num(b.ancho, 10, 100, 100)) / 100);
      const img = `<img src="${attr(src)}" alt="${attr(b.alt)}" width="${ancho}" style="display:block;width:100%;max-width:${ancho}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:${num(b.redondeo, 0, 64, 0)}px${b.alineacion === 'center' ? ';margin:0 auto' : b.alineacion === 'right' ? ';margin-left:auto' : ''}">`;
      const enlace = urlSegura(b.enlace);
      return `<div style="text-align:${b.alineacion}">${enlace ? `<a href="${attr(enlace)}" target="_blank" style="text-decoration:none">${img}</a>` : img}</div>`;
    }
    case 'boton': {
      const href = urlSegura(b.url) || '#';
      const fondo = color(b.colorFondo, '#2563eb');
      const tam = num(b.tamano, 12, 24, 16);
      const r = num(b.redondeo, 0, 40, 6);
      const ancho = b.anchoCompleto ? ' width="100%"' : '';
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${ancho} align="${b.alineacion}" style="margin:${b.alineacion === 'center' ? '0 auto' : b.alineacion === 'right' ? '0 0 0 auto' : '0'}${b.anchoCompleto ? ';width:100%' : ''}"><tr><td align="center" bgcolor="${fondo}" style="border-radius:${r}px;background:${fondo}"><a href="${attr(href)}" target="_blank" style="display:${b.anchoCompleto ? 'block' : 'inline-block'};padding:${Math.round(tam * 0.75)}px ${Math.round(tam * 1.5)}px;font-family:${a.fuente};font-size:${tam}px;font-weight:700;line-height:1.2;color:${color(b.colorTexto, '#ffffff')};text-decoration:none;border-radius:${r}px">${esc(b.texto)}</a></td></tr></table>`;
    }
    case 'divisor':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:${num(b.grosor, 1, 10, 1)}px ${b.linea} ${color(b.color, '#e2e8f0')};font-size:0;line-height:0">&nbsp;</td></tr></table>`;
    case 'espaciador':
      return `<div style="height:${num(b.alto, 4, 200, 24)}px;line-height:${num(b.alto, 4, 200, 24)}px;font-size:0">&nbsp;</div>`;
    case 'redes': {
      const iconos = b.redes
        .map((r) => {
          const info = REDES[r.red] ?? REDES.web;
          const href = urlSegura(r.url);
          if (!href) return '';
          const fondo = b.variante === 'color' ? info.color : a.colorTexto;
          return `<td style="padding:0 4px"><a href="${attr(href)}" target="_blank" title="${attr(info.nombre)}" style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:16px;background:${fondo};color:#ffffff;font-family:Arial,sans-serif;font-size:12px;font-weight:700;text-align:center;text-decoration:none">${esc(info.letra)}</a></td>`;
        })
        .join('');
      return iconos
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${b.alineacion}" style="margin:${b.alineacion === 'center' ? '0 auto' : b.alineacion === 'right' ? '0 0 0 auto' : '0'}"><tr>${iconos}</tr></table>`
        : '';
    }
    case 'html':
      return b.codigo;
    case 'tabla': {
      const tam = num(b.tamano, 11, 20, 15);
      const borde = color(b.colorBorde, '#e2e8f0');
      const filas = b.filas
        .map((f, i) => {
          const ultima = b.resaltarUltima && i === b.filas.length - 1;
          const fondo = ultima ? `background:${color(b.colorBorde, '#f1f5f9')};` : b.cebra && i % 2 === 1 ? 'background:#f8fafc;' : '';
          const peso = ultima ? 'font-weight:700;' : '';
          return `<tr><td style="${fondo}padding:10px 12px;border-bottom:1px solid ${borde};font-family:${a.fuente};font-size:${tam}px;color:${color(b.colorEtiqueta, '#64748b')};${peso}width:42%">${esc(f.etiqueta)}</td><td style="${fondo}padding:10px 12px;border-bottom:1px solid ${borde};font-family:${a.fuente};font-size:${tam}px;color:${a.colorTexto};font-weight:${ultima ? 700 : 600};text-align:right">${esc(f.valor)}</td></tr>`;
        })
        .join('');
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${borde};border-radius:6px;border-collapse:separate;overflow:hidden">${filas}</table>`;
    }
  }
}

function celda(b: Bloque, a: AjustesDiseno, anchoFila: number, enColumna: boolean): string {
  const v = num(b.estilo.rellenoV, 0, 120, 12);
  const h = num(b.estilo.rellenoH, 0, 120, 24);
  const fondo = b.estilo.fondo ? `background:${color(b.estilo.fondo, 'transparent')};` : '';
  const anchoDisponible = Math.max(40, anchoFila - h * 2);
  const contenido = b.tipo === 'columnas' ? columnas(b, a, anchoDisponible) : contenidoBloque(b, a, anchoDisponible);
  const clase = enColumna ? '' : ' class="ae-px"';
  return `<tr><td${clase} style="${fondo}padding:${v}px ${h}px">${contenido}</td></tr>`;
}

function columnas(b: BloqueColumnas, a: AjustesDiseno, ancho: number): string {
  const porcentajes = ANCHOS_DISTRIBUCION[b.distribucion] ?? [50, 50];
  const espacio = num(b.espacio, 0, 60, 16);
  const celdas = b.columnas
    .slice(0, porcentajes.length)
    .map((col, i) => {
      const pct = porcentajes[i]!;
      const anchoCol = Math.round((ancho * pct) / 100) - espacio;
      const izq = i === 0 ? 0 : espacio / 2;
      const der = i === porcentajes.length - 1 ? 0 : espacio / 2;
      const filas = col.map((x) => celda(x, a, anchoCol, true)).join('');
      return `<td class="ae-col" width="${pct}%" valign="${b.vertical}" style="width:${pct}%;padding:0 ${der}px 0 ${izq}px;vertical-align:${b.vertical}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${filas}</table></td>`;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${celdas}</tr></table>`;
}

/** HTML completo del correo. */
export function generarHtml(d: Diseno, titulo = ''): string {
  const a = d.ajustes;
  const ancho = num(a.ancho, 320, 900, 600);
  const filas = d.bloques.map((b) => celda(b, a, ancho, false)).join('');
  const preheader = a.preheader?.trim()
    ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${color(a.fondoExterior, '#ffffff')}">${esc(a.preheader.trim())}${'&#847;&zwnj;&nbsp;'.repeat(30)}</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(titulo)}</title>
<style>
body{margin:0;padding:0;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
a{color:${color(a.colorEnlace, '#2563eb')}}
@media only screen and (max-width:${ancho + 20}px){
.ae-container{width:100%!important;max-width:100%!important;border-radius:0!important}
.ae-col{display:block!important;width:100%!important;max-width:100%!important;padding:0 0 12px 0!important}
.ae-px{padding-left:16px!important;padding-right:16px!important}
.ae-outer{padding:0!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:${color(a.fondoExterior, '#f1f5f9')}">
${preheader}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${color(a.fondoExterior, '#f1f5f9')}">
<tr><td class="ae-outer" align="center" style="padding:24px 12px">
<table role="presentation" class="ae-container" width="${ancho}" cellpadding="0" cellspacing="0" border="0" style="width:${ancho}px;max-width:${ancho}px;background:${color(a.fondoContenido, '#ffffff')};border-radius:${num(a.redondeo, 0, 32, 8)}px;overflow:hidden">
${filas}
</table>
</td></tr>
</table>
</body>
</html>`;
}

function textoBloque(b: Bloque): string {
  switch (b.tipo) {
    case 'encabezado':
      return htmlATexto(b.html);
    case 'texto':
    case 'pie':
      return htmlATexto(b.html);
    case 'boton':
      return b.url && urlSegura(b.url) ? `${b.texto}: ${urlSegura(b.url)}` : b.texto;
    case 'imagen':
      return b.alt ? `[${b.alt}]` : '';
    case 'divisor':
      return '----------';
    case 'redes':
      return b.redes
        .filter((r) => urlSegura(r.url))
        .map((r) => `${(REDES[r.red] ?? REDES.web).nombre}: ${urlSegura(r.url)}`)
        .join('\n');
    case 'html':
      return htmlATexto(b.codigo);
    case 'columnas':
      return b.columnas.map((col) => col.map(textoBloque).filter(Boolean).join('\n\n')).filter(Boolean).join('\n\n');
    case 'espaciador':
      return '';
    case 'tabla':
      return b.filas.map((f) => `${f.etiqueta}: ${f.valor}`).join('\n');
  }
}

/** Versión de texto plano (para clientes sin HTML y filtros antispam). */
export function generarTexto(d: Diseno): string {
  return d.bloques
    .map(textoBloque)
    .filter((t) => t.trim())
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
