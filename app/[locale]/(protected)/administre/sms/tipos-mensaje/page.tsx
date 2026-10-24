/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getTiposMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import type { ITipoMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import { TipoMensajeManager } from '@/modules/administre/sms/tipos_mensaje';
import { ErrorCarga } from '@/modules/administre/sms/shared/components/error-carga';

export const metadata: Metadata = { title: 'Tipos de mensaje' };

export default async function TiposMensajePage() {
  let tipos: ITipoMensaje[] = [];
  try {
    tipos = await getTiposMensaje();
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/sms/tipos-mensaje]', e);
    return <ErrorCarga recurso='los tipos de mensaje' detalle={(e as Error).message} />;
  }
  return <TipoMensajeManager initialData={tipos} />;
}
