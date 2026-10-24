/** @format */

import { Link } from "@/shared/i18n/routing";

/**
 * Pie de página de la aplicación.
 *
 * Sustituye al pie heredado de una plantilla de comercio electrónico
 * ("TiendaVirtual": newsletter, métodos de pago, envíos y una decena de
 * enlaces a rutas que no existen en la app). Ahora sólo apunta a secciones
 * reales del producto.
 */
const SECTIONS = [
  { label: "Envíos", href: "/notificaciones/envios" },
  { label: "Configuración SMS", href: "/administre/sms" },
];

export const Footer = () => (
  <footer className='mt-10 border-t border-border bg-card/60'>
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8'>
      <div className='space-y-1'>
        <p className='text-sm font-semibold text-foreground'>Astra Notify</p>
        <p className='text-xs text-muted-foreground'>
          Plataforma de notificaciones: SMS, WhatsApp y correo.
        </p>
      </div>

      <nav aria-label='Secciones' className='flex flex-wrap gap-x-5 gap-y-2'>
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className='text-xs text-muted-foreground transition-colors hover:text-foreground'>
            {section.label}
          </Link>
        ))}
      </nav>

      <p className='text-xs text-muted-foreground'>
        © {new Date().getFullYear()} Astra Notify
      </p>
    </div>
  </footer>
);
