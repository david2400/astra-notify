/** @format */

import {
  AJUSTES_DEFECTO,
  crearBloque,
  type Bloque,
  type BloqueBoton,
  type BloqueColumnas,
  type BloqueEncabezado,
  type BloqueImagen,
  type BloqueSimple,
  type BloqueTexto,
  type Diseno,
} from '../models/diseno';

/** Plantillas de inicio de la galería (como "Plantillas" de Brevo): punto de partida editable. */

const titulo = (html: string, extra: Partial<BloqueEncabezado> = {}) => ({ ...(crearBloque('encabezado') as BloqueEncabezado), html, ...extra });
const texto = (html: string, extra: Partial<BloqueTexto> = {}) => ({ ...(crearBloque('texto') as BloqueTexto), html, ...extra });
const boton = (t: string, url: string, extra: Partial<BloqueBoton> = {}) => ({ ...(crearBloque('boton') as BloqueBoton), texto: t, url, ...extra });
const imagen = (extra: Partial<BloqueImagen> = {}) => ({ ...(crearBloque('imagen') as BloqueImagen), ...extra });
const cabecera = (nombre: string): Bloque => ({
  ...titulo(nombre, { nivel: 2, alineacion: 'center', color: '#ffffff' }),
  estilo: { rellenoV: 24, rellenoH: 24, fondo: '#1e3a8a' },
});
const columnas = (a: BloqueSimple[], b: BloqueSimple[]): BloqueColumnas => ({ ...(crearBloque('columnas') as BloqueColumnas), columnas: [a, b] });

export interface PlantillaGaleria {
  id: string;
  nombre: string;
  descripcion: string;
  /** Asunto sugerido. */
  asunto: string;
  crear: () => Diseno;
}

const diseno = (bloques: Bloque[], preheader = ''): Diseno => ({ version: 1, ajustes: { ...AJUSTES_DEFECTO, preheader }, bloques });

export const GALERIA: PlantillaGaleria[] = [
  {
    id: 'blanco',
    nombre: 'En blanco',
    descripcion: 'Empieza desde cero arrastrando bloques.',
    asunto: '',
    crear: () => diseno([texto('Escribe aquí tu mensaje.')]),
  },
  {
    id: 'bienvenida',
    nombre: 'Bienvenida',
    descripcion: 'Saludo, mensaje principal y botón de acción.',
    asunto: '¡Bienvenido, {{nombre}}!',
    crear: () =>
      diseno(
        [
          cabecera('Tu empresa'),
          titulo('¡Hola, {{nombre}}!', { estilo: { rellenoV: 28, rellenoH: 24, fondo: '' } }),
          texto('Nos alegra tenerte con nosotros. Desde ahora puedes acceder a todos nuestros servicios y recibir información importante en este correo.'),
          boton('Ingresar ahora', 'https://'),
          crearBloque('divisor'),
          texto('Si tienes preguntas, responde este correo y con gusto te ayudamos.', { tamano: 14, color: '#475569' }),
          crearBloque('redes'),
          crearBloque('pie'),
        ],
        'Te damos la bienvenida a nuestros servicios',
      ),
  },
  {
    id: 'notificacion',
    nombre: 'Notificación',
    descripcion: 'Aviso corto con detalle destacado.',
    asunto: 'Tienes una nueva notificación',
    crear: () =>
      diseno([
        cabecera('Tu empresa'),
        titulo('Tienes una nueva notificación', { nivel: 2, estilo: { rellenoV: 24, rellenoH: 24, fondo: '' } }),
        texto('Hola {{nombre}}, te informamos que:'),
        { ...texto('<b>{{detalle}}</b>'), estilo: { rellenoV: 16, rellenoH: 24, fondo: '#eff6ff' } },
        texto('Puedes consultar más información en nuestro portal.'),
        boton('Ver detalle', 'https://'),
        crearBloque('pie'),
      ]),
  },
  {
    id: 'codigo',
    nombre: 'Código de verificación',
    descripcion: 'Código grande y centrado, con vigencia.',
    asunto: 'Tu código de verificación es {{codigo}}',
    crear: () =>
      diseno(
        [
          titulo('Verifica tu identidad', { nivel: 2, alineacion: 'center', estilo: { rellenoV: 32, rellenoH: 24, fondo: '' } }),
          texto('Usa este código para continuar. Vence en {{minutos}} minutos.', { alineacion: 'center' }),
          {
            ...titulo('{{codigo}}', { nivel: 1, alineacion: 'center', color: '#1e3a8a' }),
            estilo: { rellenoV: 20, rellenoH: 24, fondo: '#f1f5f9' },
          },
          texto('Si no solicitaste este código, ignora este mensaje.', { alineacion: 'center', tamano: 13, color: '#64748b' }),
          crearBloque('pie'),
        ],
        'Tu código de verificación',
      ),
  },
  {
    id: 'recordatorio',
    nombre: 'Recordatorio de cita',
    descripcion: 'Fecha, hora y lugar en dos columnas.',
    asunto: 'Recordatorio: tu cita del {{fecha}}',
    crear: () =>
      diseno([
        cabecera('Tu empresa'),
        titulo('Recordatorio de tu cita', { nivel: 2, estilo: { rellenoV: 24, rellenoH: 24, fondo: '' } }),
        texto('Hola {{nombre}}, te recordamos tu próxima cita:'),
        columnas(
          [texto('<b>Fecha</b><br>{{fecha}}'), texto('<b>Hora</b><br>{{hora}}')],
          [texto('<b>Lugar</b><br>{{lugar}}'), texto('<b>Profesional</b><br>{{profesional}}')],
        ),
        boton('Confirmar asistencia', 'https://'),
        texto('Si no puedes asistir, cancela con anticipación.', { tamano: 13, color: '#64748b' }),
        crearBloque('pie'),
      ]),
  },
  {
    id: 'boletin',
    nombre: 'Boletín',
    descripcion: 'Imagen principal y dos noticias en columnas.',
    asunto: 'Novedades de este mes',
    crear: () =>
      diseno(
        [
          cabecera('Boletín'),
          imagen({ url: '', alt: 'Imagen principal', estilo: { rellenoV: 0, rellenoH: 0, fondo: '' } }),
          titulo('Lo más importante del mes', { nivel: 2, estilo: { rellenoV: 24, rellenoH: 24, fondo: '' } }),
          texto('Escribe aquí la introducción del boletín.'),
          columnas(
            [titulo('Noticia 1', { nivel: 3 }), texto('Resumen de la primera noticia.'), boton('Leer más', 'https://', { tamano: 14, alineacion: 'left' })],
            [titulo('Noticia 2', { nivel: 3 }), texto('Resumen de la segunda noticia.'), boton('Leer más', 'https://', { tamano: 14, alineacion: 'left' })],
          ),
          crearBloque('divisor'),
          crearBloque('redes'),
          crearBloque('pie'),
        ],
        'Las novedades de este mes',
      ),
  },
];
