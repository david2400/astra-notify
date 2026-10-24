/** @format */

import type { IconType } from "react-icons";
import { BiHome, BiMessageSquareDetail } from "react-icons/bi";

/**
 * Menu principal de astra-notify: una sola definicion para la barra de navegacion y la pagina de
 * inicio. Los `href` NO llevan prefijo de idioma (el `Link` de next-intl lo agrega).
 * Mas adelante se puede reemplazar por el menu que devuelva access_control segun los
 * permisos del usuario (/auth/me/menu).
 */
export type NavLeaf = { label: string; href: string };
export type NavItem = {
  label: string;
  icon: IconType;
  /** Frase corta para la tarjeta de la pagina de inicio. */
  descripcion?: string;
  href?: string;
  options?: NavLeaf[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Inicio",
    href: "/",
    icon: BiHome,
  },
  {
    label: "Notificaciones",
    icon: BiMessageSquareDetail,
    descripcion: "Envíos de SMS, WhatsApp y correo, y su historial.",
    options: [{ label: "Envíos", href: "/notificaciones/envios" }],
  },
];
