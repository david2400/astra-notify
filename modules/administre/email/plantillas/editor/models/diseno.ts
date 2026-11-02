/** @format */

/**
 * Modelo del editor visual de plantillas (estilo Brevo). Se guarda como JSON en `diseno_json`; el gateway envía el
 * `cuerpo_html` que se genera a partir de él (utils/generar-html.ts).
 */

export type Alineacion = 'left' | 'center' | 'right';

/** Espaciado y fondo comunes a todos los bloques. */
export interface EstiloBloque {
  /** Relleno vertical (px). */
  rellenoV: number;
  /** Relleno horizontal (px). */
  rellenoH: number;
  /** Color de fondo de la fila ('' = transparente). */
  fondo: string;
}

interface Base<T extends string> {
  id: string;
  tipo: T;
  estilo: EstiloBloque;
}

export interface BloqueEncabezado extends Base<'encabezado'> {
  /** HTML en línea (negrita, cursiva, enlaces, variables). */
  html: string;
  nivel: 1 | 2 | 3;
  alineacion: Alineacion;
  color: string;
}

export interface BloqueTexto extends Base<'texto'> {
  html: string;
  alineacion: Alineacion;
  color: string;
  tamano: number;
  interlineado: number;
}

export interface BloqueImagen extends Base<'imagen'> {
  url: string;
  alt: string;
  enlace: string;
  /** Ancho en % del contenedor. */
  ancho: number;
  alineacion: Alineacion;
  redondeo: number;
}

export interface BloqueBoton extends Base<'boton'> {
  texto: string;
  url: string;
  colorFondo: string;
  colorTexto: string;
  alineacion: Alineacion;
  redondeo: number;
  tamano: number;
  anchoCompleto: boolean;
}

export interface BloqueDivisor extends Base<'divisor'> {
  color: string;
  grosor: number;
  linea: 'solid' | 'dashed' | 'dotted';
}

export interface BloqueEspaciador extends Base<'espaciador'> {
  alto: number;
}

export type RedSocial = 'facebook' | 'instagram' | 'x' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp' | 'web';

export interface BloqueRedes extends Base<'redes'> {
  redes: { red: RedSocial; url: string }[];
  alineacion: Alineacion;
  /** 'color' = color de cada red; 'oscuro' = todos en el color del texto. */
  variante: 'color' | 'oscuro';
}

export interface BloquePie extends Base<'pie'> {
  html: string;
  alineacion: Alineacion;
  color: string;
  tamano: number;
}

export interface BloqueHtml extends Base<'html'> {
  codigo: string;
}

/** Tabla de datos etiqueta / valor (detalle de una cita, un pago, un trámite...). */
export interface BloqueTabla extends Base<'tabla'> {
  filas: { etiqueta: string; valor: string }[];
  /** Fondo alterno en filas pares. */
  cebra: boolean;
  colorEtiqueta: string;
  colorBorde: string;
  /** Última fila resaltada (p. ej. total). */
  resaltarUltima: boolean;
  tamano: number;
}

/** Bloques que pueden ir dentro de una columna. */
export type BloqueSimple =
  | BloqueEncabezado
  | BloqueTexto
  | BloqueImagen
  | BloqueBoton
  | BloqueDivisor
  | BloqueEspaciador
  | BloqueRedes
  | BloquePie
  | BloqueHtml
  | BloqueTabla;

export type Distribucion = '50-50' | '33-67' | '67-33' | '33-33-33';

export interface BloqueColumnas extends Base<'columnas'> {
  distribucion: Distribucion;
  /** Una lista de bloques por columna. */
  columnas: BloqueSimple[][];
  /** Separación entre columnas (px). */
  espacio: number;
  /** Alineación vertical del contenido. */
  vertical: 'top' | 'middle';
}

export type Bloque = BloqueSimple | BloqueColumnas;
export type TipoBloque = Bloque['tipo'];

export interface AjustesDiseno {
  /** Ancho del cuerpo en escritorio (px). */
  ancho: number;
  fondoExterior: string;
  fondoContenido: string;
  fuente: string;
  colorTexto: string;
  colorEnlace: string;
  /** Tamaño de letra base (px). */
  tamanoBase: number;
  redondeo: number;
  /** Texto de vista previa que muestran los clientes de correo junto al asunto (oculto en el cuerpo). */
  preheader: string;
}

export interface Diseno {
  version: 1;
  ajustes: AjustesDiseno;
  bloques: Bloque[];
  /** false = el texto plano lo escribe el usuario; si no, se genera del diseño. */
  textoAutomatico?: boolean;
}

/** Dónde insertar o mover un bloque: en la raíz o dentro de la columna `col` del bloque de columnas `padre`. */
export interface Destino {
  padre: { id: string; col: number } | null;
  indice: number;
}

export const FUENTES = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", label: 'Helvetica' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "'Courier New', Courier, monospace", label: 'Courier' },
];

export const REDES: Record<RedSocial, { nombre: string; color: string; letra: string }> = {
  facebook: { nombre: 'Facebook', color: '#1877F2', letra: 'f' },
  instagram: { nombre: 'Instagram', color: '#E4405F', letra: 'ig' },
  x: { nombre: 'X', color: '#000000', letra: 'X' },
  linkedin: { nombre: 'LinkedIn', color: '#0A66C2', letra: 'in' },
  youtube: { nombre: 'YouTube', color: '#FF0000', letra: '▶' },
  tiktok: { nombre: 'TikTok', color: '#111111', letra: '♪' },
  whatsapp: { nombre: 'WhatsApp', color: '#25D366', letra: 'wa' },
  web: { nombre: 'Sitio web', color: '#475569', letra: 'www' },
};

export const AJUSTES_DEFECTO: AjustesDiseno = {
  ancho: 600,
  fondoExterior: '#f1f5f9',
  fondoContenido: '#ffffff',
  fuente: FUENTES[0]!.value,
  colorTexto: '#1f2937',
  colorEnlace: '#2563eb',
  tamanoBase: 16,
  redondeo: 8,
  preheader: '',
};

const ESTILO = (rellenoV = 12, rellenoH = 24, fondo = ''): EstiloBloque => ({ rellenoV, rellenoH, fondo });

let contador = 0;
/** Id corto y único en la sesión (no se usa como clave en el gateway). */
export const nuevoId = () => `b${Date.now().toString(36)}${(contador++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Bloque nuevo con valores por defecto. */
export function crearBloque(tipo: TipoBloque): Bloque {
  const id = nuevoId();
  switch (tipo) {
    case 'encabezado':
      return { id, tipo, estilo: ESTILO(16), html: 'Escribe un título', nivel: 1, alineacion: 'left', color: '' };
    case 'texto':
      return {
        id,
        tipo,
        estilo: ESTILO(),
        html: 'Escribe aquí tu mensaje. Usa <b>Personalizar</b> para insertar variables como {{nombre}}.',
        alineacion: 'left',
        color: '',
        tamano: 0,
        interlineado: 1.6,
      };
    case 'imagen':
      return { id, tipo, estilo: ESTILO(12), url: '', alt: '', enlace: '', ancho: 100, alineacion: 'center', redondeo: 0 };
    case 'boton':
      return {
        id,
        tipo,
        estilo: ESTILO(16),
        texto: 'Ver más',
        url: 'https://',
        colorFondo: '#2563eb',
        colorTexto: '#ffffff',
        alineacion: 'center',
        redondeo: 6,
        tamano: 16,
        anchoCompleto: false,
      };
    case 'divisor':
      return { id, tipo, estilo: ESTILO(16), color: '#e2e8f0', grosor: 1, linea: 'solid' };
    case 'espaciador':
      return { id, tipo, estilo: ESTILO(0, 0), alto: 24 };
    case 'redes':
      return {
        id,
        tipo,
        estilo: ESTILO(16),
        redes: [
          { red: 'facebook', url: 'https://facebook.com/' },
          { red: 'instagram', url: 'https://instagram.com/' },
          { red: 'web', url: 'https://' },
        ],
        alineacion: 'center',
        variante: 'color',
      };
    case 'pie':
      return {
        id,
        tipo,
        estilo: ESTILO(20, 24, '#f8fafc'),
        html: 'Nombre de la empresa · Dirección · Ciudad<br>Recibes este correo porque eres usuario de nuestros servicios.',
        alineacion: 'center',
        color: '#64748b',
        tamano: 12,
      };
    case 'html':
      return { id, tipo, estilo: ESTILO(0, 0), codigo: '<p style="margin:0">HTML personalizado</p>' };
    case 'tabla':
      return {
        id,
        tipo,
        estilo: ESTILO(12),
        filas: [
          { etiqueta: 'Fecha', valor: '{{fecha}}' },
          { etiqueta: 'Referencia', valor: '{{referencia}}' },
          { etiqueta: 'Valor', valor: '{{valor}}' },
        ],
        cebra: true,
        colorEtiqueta: '#64748b',
        colorBorde: '#e2e8f0',
        resaltarUltima: false,
        tamano: 15,
      };
    case 'columnas':
      return {
        id,
        tipo,
        estilo: ESTILO(12),
        distribucion: '50-50',
        columnas: [[crearBloque('texto') as BloqueSimple], [crearBloque('texto') as BloqueSimple]],
        espacio: 16,
        vertical: 'top',
      };
  }
}

export const PALETA: { tipo: TipoBloque; etiqueta: string; descripcion: string }[] = [
  { tipo: 'encabezado', etiqueta: 'Título', descripcion: 'Encabezado H1–H3' },
  { tipo: 'texto', etiqueta: 'Texto', descripcion: 'Párrafos con formato' },
  { tipo: 'imagen', etiqueta: 'Imagen', descripcion: 'Imagen por URL con enlace' },
  { tipo: 'boton', etiqueta: 'Botón', descripcion: 'Llamado a la acción' },
  { tipo: 'columnas', etiqueta: 'Columnas', descripcion: '2 o 3 columnas' },
  { tipo: 'tabla', etiqueta: 'Tabla de datos', descripcion: 'Filas etiqueta / valor' },
  { tipo: 'divisor', etiqueta: 'Divisor', descripcion: 'Línea separadora' },
  { tipo: 'espaciador', etiqueta: 'Espacio', descripcion: 'Espacio en blanco' },
  { tipo: 'redes', etiqueta: 'Redes sociales', descripcion: 'Enlaces a redes' },
  { tipo: 'pie', etiqueta: 'Pie de página', descripcion: 'Datos legales y contacto' },
  { tipo: 'html', etiqueta: 'HTML', descripcion: 'Código personalizado' },
];

export const ANCHOS_DISTRIBUCION: Record<Distribucion, number[]> = {
  '50-50': [50, 50],
  '33-67': [33, 67],
  '67-33': [67, 33],
  '33-33-33': [33.33, 33.33, 33.34],
};

export function disenoVacio(): Diseno {
  return { version: 1, ajustes: { ...AJUSTES_DEFECTO }, bloques: [] };
}

/** Lee `diseno_json`; null si no es un diseño válido (la plantilla se edita entonces como HTML). */
export function leerDiseno(json: string | null | undefined): Diseno | null {
  if (!json) return null;
  try {
    const d = JSON.parse(json) as Partial<Diseno>;
    if (d?.version !== 1 || !Array.isArray(d.bloques)) return null;
    return {
      version: 1,
      ajustes: { ...AJUSTES_DEFECTO, ...(d.ajustes ?? {}) },
      bloques: d.bloques as Bloque[],
      textoAutomatico: d.textoAutomatico !== false,
    };
  } catch {
    return null;
  }
}

/** Copia profunda con ids nuevos (duplicar bloques y plantillas de la galería). */
export function clonarConIdsNuevos<T extends Bloque>(b: T): T {
  const copia = JSON.parse(JSON.stringify(b)) as T;
  copia.id = nuevoId();
  if (copia.tipo === 'columnas') {
    (copia as BloqueColumnas).columnas = (copia as BloqueColumnas).columnas.map((col) => col.map((x) => clonarConIdsNuevos(x)));
  }
  return copia;
}
