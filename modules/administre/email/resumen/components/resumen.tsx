/** @format */

import { Link } from '@/shared/i18n/routing';
import { EMAIL_ADMIN_SECCIONES } from '../../shared/utils/secciones';

export interface ResumenEmail {
  proveedores: number | null;
  cuentas: number | null;
  tiposMensaje: number | null;
  rutas: number | null;
  plantillas: number | null;
  /** Conteo de la cola por estado (null si no se pudo leer). */
  cola: { pendientes: number | null; reintento: number | null; fallidos: number | null };
  /** Problemas que harían fallar envíos (calculados con los datos del gateway). */
  alertas: string[];
}

const CONTEOS: Record<string, keyof Omit<ResumenEmail, 'alertas' | 'cola'>> = {
  '/administre/email/proveedores': 'proveedores',
  '/administre/email/cuentas': 'cuentas',
  '/administre/email/tipos-mensaje': 'tiposMensaje',
  '/administre/email/rutas': 'rutas',
  '/administre/email/plantillas': 'plantillas',
};

const ver = (n: number | null) => (n === null ? '—' : n);

/** Estado de la cola, tarjetas por módulo y alertas de configuración. */
export function ResumenEmailScene({ data }: { data: ResumenEmail }) {
  const cola = [
    { label: 'Pendientes', valor: data.cola.pendientes, href: '/administre/email/envios?estado=PENDIENTE' },
    { label: 'En reintento', valor: data.cola.reintento, href: '/administre/email/envios?estado=REINTENTO' },
    { label: 'Fallidos', valor: data.cola.fallidos, href: '/administre/email/envios?estado=FALLIDO', alerta: true },
  ];
  return (
    <div className='space-y-6'>
      {data.alertas.length ? (
        <div role='status' className='rounded-xl border border-destructive/40 bg-destructive/5 p-4'>
          <p className='text-sm font-semibold text-foreground'>Revisa la configuración</p>
          <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground'>
            {data.alertas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className='grid gap-4 sm:grid-cols-3'>
        {cola.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className='rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/50 hover:bg-primary/5'>
            <p className='text-sm text-muted-foreground'>{c.label}</p>
            <p className={`mt-1 text-3xl font-bold ${c.alerta && (c.valor ?? 0) > 0 ? 'text-destructive' : 'text-primary'}`}>{ver(c.valor)}</p>
          </Link>
        ))}
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {EMAIL_ADMIN_SECCIONES.filter((s) => s.href !== '/administre/email').map((seccion) => {
          const clave = CONTEOS[seccion.href];
          const valor = clave ? data[clave] : undefined;
          return (
            <Link
              key={seccion.href}
              href={seccion.href}
              className='group rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/50 hover:bg-primary/5'>
              <div className='flex items-baseline justify-between gap-2'>
                <p className='text-base font-semibold text-foreground'>{seccion.label}</p>
                {valor !== undefined ? <span className='text-2xl font-bold text-primary'>{ver(valor)}</span> : null}
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>{seccion.descripcion}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
