/** @format */

import { SectionShell } from '@/components/layout/section-shell';
import type { IEnvio } from '../models/envio.interface';
import { EnviosVacio } from '../components/envios-vacio';

/**
 * Pantalla de envíos: módulo de ejemplo con la misma estructura de draco
 * (components / models / schemas / scenes). La página (app/) solo carga datos
 * en el servidor y delega aquí la presentación.
 */
export function EnviosScene({ envios }: { envios: IEnvio[] }) {
  return (
    <SectionShell
      eyebrow='Notificaciones'
      title='Envíos'
      description='Historial de notificaciones enviadas por SMS, WhatsApp y correo.'>
      {envios.length === 0 ? (
        <EnviosVacio />
      ) : (
        <ul className='divide-y divide-border rounded-xl border border-border bg-card'>
          {envios.map((envio) => (
            <li key={envio.envioId} className='flex items-center justify-between px-4 py-3 text-sm'>
              <span className='font-medium text-foreground'>{envio.destino}</span>
              <span className='text-muted-foreground'>
                {envio.canal} · {envio.estado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}
