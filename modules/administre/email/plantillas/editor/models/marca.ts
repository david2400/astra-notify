/** @format */

import type { IMarca } from '@/server/domains/administre/email/disenos/types';
import { AJUSTES_DEFECTO, REDES, type AjustesDiseno, type Diseno, type RedSocial } from './diseno';

/** Marca corporativa tal como la usa el editor (la guarda email_gateway en /admin/marca). */
export type MarcaEditor = IMarca;

export const MARCA_EDITOR_DEFECTO: MarcaEditor = {
  nombre_empresa: 'Mi empresa',
  logo_ancho: 160,
  color_primario: '#1e3a8a',
  color_secundario: '#2563eb',
  color_texto: AJUSTES_DEFECTO.colorTexto,
  color_fondo: AJUSTES_DEFECTO.fondoContenido,
  color_fondo_exterior: AJUSTES_DEFECTO.fondoExterior,
  fuente: AJUSTES_DEFECTO.fuente,
  redes_json: '[]',
};

/** Redes de la marca con red conocida y URL válida. */
export function redesDeMarca(m: MarcaEditor): { red: RedSocial; url: string }[] {
  try {
    const lista = JSON.parse(m.redes_json || '[]') as { red?: string; url?: string }[];
    return lista
      .filter((r) => r && typeof r.url === 'string' && /^https?:\/\/\S+$/.test(r.url) && r.red && r.red in REDES)
      .map((r) => ({ red: r.red as RedSocial, url: r.url! }));
  } catch {
    return [];
  }
}

/** Estilos globales del correo a partir de la marca. */
export function ajustesDeMarca(m: MarcaEditor, base: AjustesDiseno = AJUSTES_DEFECTO): AjustesDiseno {
  return {
    ...base,
    fondoExterior: m.color_fondo_exterior,
    fondoContenido: m.color_fondo,
    colorTexto: m.color_texto,
    colorEnlace: m.color_secundario,
    fuente: m.fuente,
  };
}

/** Aplica colores y fuente de la marca al diseño (no toca el contenido). */
export function aplicarMarca(d: Diseno, m: MarcaEditor): Diseno {
  return { ...d, ajustes: ajustesDeMarca(m, d.ajustes) };
}

/** Línea de contacto del pie: dirección · teléfono · email · sitio. */
export function contactoDeMarca(m: MarcaEditor): string {
  return [m.direccion, m.telefono, m.email_contacto, m.sitio_web].filter((x) => x && String(x).trim()).join(' · ');
}
