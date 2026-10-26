/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getTiposMensajeEmail, type ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje';
import { TipoMensajeEmailManager } from '@/modules/administre/email/tipos_mensaje';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Tipos de mensaje Email' };

export default async function TiposMensajeEmailPage() {
  let tipos: ITipoMensaje[] = [];
  try {
    tipos = await getTiposMensajeEmail();
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/tipos-mensaje]', e);
    return <ErrorCarga recurso='los tipos de mensaje' detalle={(e as Error).message} />;
  }
  return <TipoMensajeEmailManager initialData={tipos} />;
}
