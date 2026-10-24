/** @format */

import { Link } from '@/shared/i18n/routing';
import { SMS_ADMIN_SECCIONES } from '../../shared/utils/secciones';

export interface ResumenSms {
  proveedores: number | null;
  cuentas: number | null;
  tiposMensaje: number | null;
  rutas: number | null;
  plantillas: number | null;
  /** Problemas que harían fallar envíos (calculados con los datos del gateway). */
  alertas: string[];
}

const CONTEOS: Record<string, keyof Omit<ResumenSms, 'alertas'>> = {
  '/administre/sms/proveedores': 'proveedores',
  '/administre/sms/cuentas': 'cuentas',
  '/administre/sms/tipos-mensaje': 'tiposMensaje',
  '/administre/sms/rutas': 'rutas',
  '/administre/sms/plantillas': 'plantillas',
};

/** Tarjetas por módulo con su conteo y alertas de configuración. */
export function ResumenScene({ data }: { data: ResumenSms }) {
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
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {SMS_ADMIN_SECCIONES.filter((s) => s.href !== '/administre/sms').map((seccion) => {
          const clave = CONTEOS[seccion.href];
          const valor = clave ? data[clave] : undefined;
          return (
            <Link
              key={seccion.href}
              href={seccion.href}
              className='group rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/50 hover:bg-primary/5'>
              <div className='flex items-baseline justify-between gap-2'>
                <p className='text-base font-semibold text-foreground'>{seccion.label}</p>
                {valor !== undefined ? (
                  <span className='text-2xl font-bold text-primary'>{valor === null ? '—' : valor}</span>
                ) : null}
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>{seccion.descripcion}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
