/** @format */

import type { ReactNode } from "react";

interface SectionShellProps {
  /** Etiqueta corta que ubica al usuario dentro del producto. */
  eyebrow: string;
  /** Título principal de la sección (único `h1` de la página). */
  title: string;
  /** Frase de apoyo que explica qué se puede hacer aquí. */
  description?: string;
  /** Acciones a nivel de sección alineadas a la derecha del encabezado. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Contenedor común de las secciones del área protegida.
 *
 * Unifica ancho, espaciados y jerarquía tipográfica del encabezado para que
 * Control académico, Estructura institucional y Gestión de alumnos se vean
 * igual. Antes cada layout repetía este bloque con valores distintos y,
 * además, duplicaba el título dentro de la tarjeta.
 */
export function SectionShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: SectionShellProps) {
  return (
    <section className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-primary'>
            {eyebrow}
          </p>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
            {title}
          </h1>
          {description ? (
            <p className='max-w-3xl text-sm text-muted-foreground'>{description}</p>
          ) : null}
        </div>
        {actions ? <div className='flex items-center gap-2'>{actions}</div> : null}
      </header>

      <div className='rounded-xl border border-border bg-card text-card-foreground shadow-sm'>
        <div className='p-4 sm:p-6'>{children}</div>
      </div>
    </section>
  );
}
