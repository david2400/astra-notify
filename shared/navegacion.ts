/** @format */

import type { IconType } from "react-icons";
import { BiCog, BiHome, BiMessageSquareDetail } from "react-icons/bi";

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
  {
    label: "Administración SMS",
    icon: BiCog,
    descripcion: "Proveedores, cuentas, rutas y plantillas del gateway de SMS.",
    options: [
      { label: "Resumen", href: "/administre/sms" },
      { label: "Proveedores", href: "/administre/sms/proveedores" },
      { label: "Cuentas", href: "/administre/sms/cuentas" },
      { label: "Tipos de mensaje", href: "/administre/sms/tipos-mensaje" },
      { label: "Servicios por proveedor", href: "/administre/sms/servicios" },
      { label: "Rutas", href: "/administre/sms/rutas" },
      { label: "Plantillas", href: "/administre/sms/plantillas" },
    ],
  },
];
