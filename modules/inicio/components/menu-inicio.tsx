"use client";

import * as React from "react";
import { BiBarChartAlt2, BiChevronRight, BiSearch, BiX } from "react-icons/bi";
import { Link } from "@/shared/i18n/routing";
import { NAV_ITEMS } from "@/shared/navegacion";

/** Quita tildes y mayusculas para buscar "examenes" y encontrar "Exámenes". */
const normalizar = (t: string) =>
  t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const MODULOS = NAV_ITEMS.filter((m) => m.options?.length);

export function MenuInicio({ nombre }: { nombre: string | null }) {
  const [busqueda, setBusqueda] = React.useState("");
  const q = normalizar(busqueda.trim());

  // Si el texto coincide con el modulo se muestran todas sus opciones; si no, solo las que coinciden.
  const visibles = MODULOS.map((m) => {
    if (!q || normalizar(m.label).includes(q)) return m;
    return { ...m, options: m.options!.filter((o) => normalizar(o.label).includes(q)) };
  }).filter((m) => m.options && m.options.length > 0);

  const total = MODULOS.reduce((n, m) => n + (m.options?.length ?? 0), 0);

  return (
    <section className='mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8'>
      <header className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-primary'>Inicio</p>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
            {nombre ? `Hola, ${nombre.split(" ")[0]}` : "Bienvenido"}
          </h1>
          <p className='max-w-xl text-sm text-muted-foreground'>
            Elige a dónde quieres ir. Tienes {MODULOS.length} módulos y {total} opciones disponibles.
          </p>
        </div>

        <div className='flex w-full flex-col gap-3 sm:flex-row lg:w-auto'>
          <div className='relative w-full sm:w-80'>
            <BiSearch
              className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
              aria-hidden='true'
            />
            <input
              type='search'
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder='Buscar una opción… (ej. clases)'
              aria-label='Buscar en el menú'
              className='h-10 w-full rounded-xl border border-border bg-card pl-9 pr-9 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 [&::-webkit-search-cancel-button]:hidden'
            />
            {busqueda && (
              <button
                type='button'
                onClick={() => setBusqueda("")}
                aria-label='Limpiar búsqueda'
                className='absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground'>
                <BiX className='h-4 w-4' aria-hidden='true' />
              </button>
            )}
          </div>
          <Link
            href='/panel'
            className='inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary'>
            <BiBarChartAlt2 className='h-4 w-4' aria-hidden='true' />
            Panel general
          </Link>
        </div>
      </header>

      {visibles.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center'>
          <p className='text-sm font-medium text-foreground'>No hay opciones que coincidan con “{busqueda}”.</p>
          <p className='mt-1 text-sm text-muted-foreground'>Prueba con otra palabra.</p>
        </div>
      ) : (
        <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
          {visibles.map(({ label, icon: Icono, descripcion, options }) => (
            <article
              key={label}
              className='flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md'>
              <div className='flex items-start gap-3'>
                <span className='grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
                  <Icono className='h-5 w-5' aria-hidden='true' />
                </span>
                <div className='min-w-0'>
                  <h2 className='font-semibold text-foreground'>{label}</h2>
                  {descripcion && <p className='text-sm text-muted-foreground'>{descripcion}</p>}
                </div>
              </div>
              <ul className='mt-4 grid gap-1'>
                {options!.map((o) => (
                  <li key={o.href}>
                    <Link
                      href={o.href}
                      className='group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                      <span>{o.label}</span>
                      <BiChevronRight
                        className='h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary'
                        aria-hidden='true'
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
