/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getComponentesEmail, getMarcaEmail, type IComponente, type IMarca } from '@/server/domains/administre/email/disenos';
import { MarcaEmailManager } from '@/modules/administre/email/marca';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Marca y componentes' };

export default async function MarcaEmailPage() {
  let marca: IMarca;
  let componentes: IComponente[] = [];
  try {
    [marca, componentes] = await Promise.all([getMarcaEmail(), getComponentesEmail(true)]);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/marca]', e);
    return <ErrorCarga recurso='la marca y los componentes' detalle={(e as Error).message} />;
  }
  return <MarcaEmailManager marca={marca} componentes={componentes} />;
}
