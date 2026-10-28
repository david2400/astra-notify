/** @format */

/** Alfabeto GSM 03.38 (básico + extensión, que cuenta doble). */
const GSM_BASICO =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM_EXTENSION = '^{}\\[~]|€';

export interface Segmentos {
  codificacion: 'GSM7' | 'UCS2';
  longitud: number;
  partes: number;
  /** Caracteres por SMS en este mensaje (160/153 o 70/67). */
  porParte: number;
}

/**
 * Estimación de SMS facturables (igual criterio que sms_gateway): GSM7 160 caracteres (153 si se concatena);
 * con cualquier carácter fuera de GSM (tildes como á, emojis) pasa a UCS2: 70 (67).
 */
export function calcularSegmentos(texto: string): Segmentos {
  let gsm = true;
  let longitud = 0;
  for (const c of texto) {
    if (GSM_BASICO.includes(c)) longitud += 1;
    else if (GSM_EXTENSION.includes(c)) longitud += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (!gsm) {
    // UCS2 cuenta unidades UTF-16 (un emoji ocupa 2)
    longitud = texto.length;
    const porParte = longitud > 70 ? 67 : 70;
    return { codificacion: 'UCS2', longitud, partes: longitud === 0 ? 0 : Math.ceil(longitud / porParte), porParte };
  }
  const porParte = longitud > 160 ? 153 : 160;
  return { codificacion: 'GSM7', longitud, partes: longitud === 0 ? 0 : Math.ceil(longitud / porParte), porParte };
}

/** Número de celular: 10 a 15 dígitos, '+' opcional (mismo patrón que sms_gateway). */
export const TELEFONO = /^\+?\d{10,15}$/;
export const normalizarTelefono = (v: string) => v.replace(/[\s\-().]/g, '');
