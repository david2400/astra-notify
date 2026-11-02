/** @format */

import {
  crearBloque,
  type Bloque,
  type BloqueBoton,
  type BloqueColumnas,
  type BloqueEncabezado,
  type BloqueImagen,
  type BloquePie,
  type BloqueRedes,
  type BloqueSimple,
  type BloqueTabla,
  type BloqueTexto,
  type EstiloBloque,
} from '../models/diseno';
import { contactoDeMarca, redesDeMarca, type MarcaEditor } from '../models/marca';

/**
 * Secciones prediseñadas de la biblioteca (como los "bloques de diseño" de Brevo): combinaciones de bloques listas
 * para arrastrar, construidas con la marca corporativa (logo, colores, fuente, contacto y redes). Cada llamada
 * crea bloques nuevos con ids propios.
 */

export type CategoriaSeccion = 'ENCABEZADO' | 'BANNER' | 'CONTENIDO' | 'ACCION' | 'DATOS' | 'PIE';

export const CATEGORIAS_SECCION: { id: CategoriaSeccion; etiqueta: string }[] = [
  { id: 'ENCABEZADO', etiqueta: 'Encabezados' },
  { id: 'BANNER', etiqueta: 'Banners' },
  { id: 'CONTENIDO', etiqueta: 'Contenido' },
  { id: 'ACCION', etiqueta: 'Llamados a la acción' },
  { id: 'DATOS', etiqueta: 'Datos' },
  { id: 'PIE', etiqueta: 'Pies de página' },
];

export interface Seccion {
  id: string;
  nombre: string;
  categoria: CategoriaSeccion;
  descripcion: string;
  crear: (m: MarcaEditor) => Bloque[];
}

/** Texto de la marca dentro de HTML de un bloque. */
const h = (s: string | null | undefined) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const est = (rellenoV: number, rellenoH = 24, fondo = ''): EstiloBloque => ({ rellenoV, rellenoH, fondo });
const titulo = (html: string, x: Partial<BloqueEncabezado> = {}): BloqueEncabezado => ({ ...(crearBloque('encabezado') as BloqueEncabezado), html, ...x });
const texto = (html: string, x: Partial<BloqueTexto> = {}): BloqueTexto => ({ ...(crearBloque('texto') as BloqueTexto), html, ...x });
const imagen = (x: Partial<BloqueImagen> = {}): BloqueImagen => ({ ...(crearBloque('imagen') as BloqueImagen), ...x });
const tabla = (x: Partial<BloqueTabla> = {}): BloqueTabla => ({ ...(crearBloque('tabla') as BloqueTabla), ...x });
const columnas = (cols: BloqueSimple[][], x: Partial<BloqueColumnas> = {}): BloqueColumnas => ({
  ...(crearBloque('columnas') as BloqueColumnas),
  columnas: cols,
  distribucion: cols.length === 3 ? '33-33-33' : '50-50',
  ...x,
});
const boton = (m: MarcaEditor, t: string, x: Partial<BloqueBoton> = {}): BloqueBoton => ({
  ...(crearBloque('boton') as BloqueBoton),
  texto: t,
  url: '{{enlace}}',
  colorFondo: m.color_secundario,
  colorTexto: '#ffffff',
  ...x,
});
const logo = (m: MarcaEditor, alineacion: 'left' | 'center', fondo = ''): BloqueSimple =>
  m.logo_url
    ? imagen({ url: m.logo_url, alt: m.nombre_empresa, ancho: Math.round(((m.logo_ancho ?? 160) / 552) * 100), alineacion, estilo: est(20, 24, fondo) })
    : titulo(h(m.nombre_empresa), { nivel: 2, alineacion, color: fondo ? '#ffffff' : m.color_primario, estilo: est(20, 24, fondo) });
const redes = (m: MarcaEditor, fondo = ''): BloqueRedes => {
  const r = redesDeMarca(m);
  return { ...(crearBloque('redes') as BloqueRedes), redes: r.length ? r : (crearBloque('redes') as BloqueRedes).redes, estilo: est(12, 24, fondo) };
};
const pie = (m: MarcaEditor, html: string, fondo = '#f8fafc'): BloquePie => ({ ...(crearBloque('pie') as BloquePie), html, estilo: est(20, 24, fondo) });

export const SECCIONES: Seccion[] = [
  // ---------- Encabezados ----------
  {
    id: 'enc-logo',
    nombre: 'Logo centrado',
    categoria: 'ENCABEZADO',
    descripcion: 'Logo de la marca sobre fondo blanco y línea de color.',
    crear: (m) => [logo(m, 'center'), { ...(crearBloque('divisor') as Bloque), estilo: est(0, 0), color: m.color_primario, grosor: 4 } as Bloque],
  },
  {
    id: 'enc-barra',
    nombre: 'Barra de color',
    categoria: 'ENCABEZADO',
    descripcion: 'Franja con el color principal y el logo o nombre.',
    crear: (m) => [logo(m, 'center', m.color_primario)],
  },
  {
    id: 'enc-logo-enlace',
    nombre: 'Logo y enlace',
    categoria: 'ENCABEZADO',
    descripcion: 'Logo a la izquierda y enlace "Ver en el navegador" a la derecha.',
    crear: (m) => [
      columnas([[logo(m, 'left')], [texto(`<a href="${h(m.sitio_web || 'https://')}">Ir al sitio web</a>`, { alineacion: 'right', tamano: 13, estilo: est(20) })]], {
        vertical: 'middle',
        espacio: 0,
        estilo: est(0, 0),
      }),
    ],
  },
  // ---------- Banners ----------
  {
    id: 'ban-hero',
    nombre: 'Banner principal',
    categoria: 'BANNER',
    descripcion: 'Título grande, texto y botón sobre el color de la marca.',
    crear: (m) => [
      titulo('Un título que llame la atención', { nivel: 1, alineacion: 'center', color: '#ffffff', estilo: est(40, 32, m.color_primario) }),
      texto('Describe en una o dos líneas el mensaje principal del correo.', { alineacion: 'center', color: '#e2e8f0', estilo: est(0, 40, m.color_primario) }),
      { ...boton(m, 'Conocer más', { colorFondo: '#ffffff', colorTexto: m.color_primario }), estilo: est(24, 24, m.color_primario) },
      { ...(crearBloque('espaciador') as Bloque), estilo: est(0, 0, m.color_primario), alto: 16 } as Bloque,
    ],
  },
  {
    id: 'ban-imagen',
    nombre: 'Imagen de portada',
    categoria: 'BANNER',
    descripcion: 'Imagen a todo el ancho con título debajo.',
    crear: () => [imagen({ alt: 'Imagen principal', estilo: est(0, 0) }), titulo('Título de la noticia', { nivel: 2, estilo: est(24) })],
  },
  // ---------- Contenido ----------
  {
    id: 'con-saludo',
    nombre: 'Saludo y mensaje',
    categoria: 'CONTENIDO',
    descripcion: 'Saludo personalizado con párrafo.',
    crear: () => [
      titulo('Hola, {{nombre}}', { nivel: 2, estilo: est(24) }),
      texto('Escribe aquí el mensaje. Puedes usar <b>negrita</b>, enlaces y variables con el botón Personalizar.'),
    ],
  },
  {
    id: 'con-img-texto',
    nombre: 'Imagen y texto',
    categoria: 'CONTENIDO',
    descripcion: 'Imagen a la izquierda, título y texto a la derecha.',
    crear: (m) => [
      columnas([[imagen({ alt: 'Imagen', estilo: est(0, 0), redondeo: 8 })], [titulo('Título', { nivel: 3, estilo: est(0, 0) }), texto('Texto descriptivo breve.', { estilo: est(8, 0) }), boton(m, 'Ver más', { alineacion: 'left', tamano: 14, estilo: est(8, 0) })]], {
        vertical: 'middle',
        estilo: est(16),
      }),
    ],
  },
  {
    id: 'con-texto-img',
    nombre: 'Texto e imagen',
    categoria: 'CONTENIDO',
    descripcion: 'Título y texto a la izquierda, imagen a la derecha.',
    crear: () => [
      columnas([[titulo('Título', { nivel: 3, estilo: est(0, 0) }), texto('Texto descriptivo breve.', { estilo: est(8, 0) })], [imagen({ alt: 'Imagen', estilo: est(0, 0), redondeo: 8 })]], {
        vertical: 'middle',
        estilo: est(16),
      }),
    ],
  },
  {
    id: 'con-3-columnas',
    nombre: 'Tres beneficios',
    categoria: 'CONTENIDO',
    descripcion: 'Tres columnas con ícono/imagen, título y texto.',
    crear: (m) => {
      const col = (n: number) => [
        titulo(`Beneficio ${n}`, { nivel: 3, alineacion: 'center', color: m.color_primario, estilo: est(0, 0) }),
        texto('Descripción corta del beneficio.', { alineacion: 'center', tamano: 14, estilo: est(6, 0) }),
      ];
      return [columnas([col(1), col(2), col(3)], { estilo: est(20) })];
    },
  },
  {
    id: 'con-destacado',
    nombre: 'Mensaje destacado',
    categoria: 'CONTENIDO',
    descripcion: 'Recuadro de color para avisos importantes.',
    crear: (m) => [
      texto(`<b>Importante:</b> escribe aquí el aviso que el usuario no debe pasar por alto.`, {
        estilo: est(16, 24, '#f8fafc'),
        color: m.color_texto,
      }),
    ],
  },
  // ---------- Llamados a la acción ----------
  {
    id: 'acc-boton',
    nombre: 'Botón con texto',
    categoria: 'ACCION',
    descripcion: 'Frase de cierre y botón centrado.',
    crear: (m) => [texto('¿Listo para continuar?', { alineacion: 'center', estilo: est(16) }), boton(m, 'Ingresar ahora', { estilo: est(8, 24) })],
  },
  {
    id: 'acc-doble',
    nombre: 'Dos botones',
    categoria: 'ACCION',
    descripcion: 'Acción principal y secundaria lado a lado.',
    crear: (m) => [
      columnas([[boton(m, 'Aceptar', { alineacion: 'right', estilo: est(0, 0) })], [boton(m, 'Ver detalle', { alineacion: 'left', colorFondo: '#ffffff', colorTexto: m.color_secundario, estilo: est(0, 0) })]], {
        estilo: est(16),
      }),
    ],
  },
  {
    id: 'acc-boton-completo',
    nombre: 'Botón a todo el ancho',
    categoria: 'ACCION',
    descripcion: 'Botón grande, ideal para móviles.',
    crear: (m) => [boton(m, 'Confirmar', { anchoCompleto: true, tamano: 18, estilo: est(16) })],
  },
  // ---------- Datos ----------
  {
    id: 'dat-detalle',
    nombre: 'Detalle del trámite',
    categoria: 'DATOS',
    descripcion: 'Título y tabla etiqueta / valor con variables.',
    crear: () => [titulo('Detalle', { nivel: 3, estilo: est(16, 24) }), tabla({ estilo: est(4) })],
  },
  {
    id: 'dat-pago',
    nombre: 'Resumen de pago',
    categoria: 'DATOS',
    descripcion: 'Conceptos y total resaltado.',
    crear: () => [
      titulo('Resumen de tu pago', { nivel: 3, estilo: est(16, 24) }),
      tabla({
        filas: [
          { etiqueta: 'Concepto', valor: '{{concepto}}' },
          { etiqueta: 'Referencia', valor: '{{referencia}}' },
          { etiqueta: 'Fecha', valor: '{{fecha}}' },
          { etiqueta: 'Total pagado', valor: '{{valor}}' },
        ],
        resaltarUltima: true,
        estilo: est(4),
      }),
    ],
  },
  {
    id: 'dat-codigo',
    nombre: 'Código de verificación',
    categoria: 'DATOS',
    descripcion: 'Código grande centrado con vigencia.',
    crear: (m) => [
      texto('Tu código de verificación es:', { alineacion: 'center', estilo: est(16) }),
      titulo('{{codigo}}', { nivel: 1, alineacion: 'center', color: m.color_primario, estilo: est(16, 24, '#f1f5f9') }),
      texto('Vence en {{minutos}} minutos. No lo compartas con nadie.', { alineacion: 'center', tamano: 13, color: '#64748b', estilo: est(12) }),
    ],
  },
  // ---------- Pies ----------
  {
    id: 'pie-completo',
    nombre: 'Pie corporativo',
    categoria: 'PIE',
    descripcion: 'Redes, datos de contacto y texto legal de la marca.',
    crear: (m) => [
      redes(m, '#f8fafc'),
      pie(m, [`<b>${h(m.nombre_empresa)}</b>`, h(contactoDeMarca(m)), m.pie_legal || 'Recibes este correo porque eres usuario de nuestros servicios.'].filter(Boolean).join('<br>')),
    ],
  },
  {
    id: 'pie-simple',
    nombre: 'Pie simple',
    categoria: 'PIE',
    descripcion: 'Solo nombre de la empresa y texto legal.',
    crear: (m) => [pie(m, [h(m.nombre_empresa), m.pie_legal || 'Este es un mensaje automático, por favor no respondas.'].join('<br>'))],
  },
  {
    id: 'pie-firma',
    nombre: 'Firma',
    categoria: 'PIE',
    descripcion: 'Despedida con nombre del equipo.',
    crear: (m) => [texto(`Cordialmente,<br><b>Equipo ${h(m.nombre_empresa)}</b>`, { estilo: est(16) })],
  },
];
