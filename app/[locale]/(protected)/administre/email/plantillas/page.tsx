/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getPlantillasEmail, type IPlantilla } from '@/server/domains/administre/email/plantillas';
import { PlantillaEmailManager } from '@/modules/administre/email/plantillas';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Plantillas Email' };

export default async function PlantillasEmailPage() {
  let plantillas: IPlantilla[] = [];
  try {
    plantillas = await getPlantillasEmail();
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/plantillas]', e);
    return <ErrorCarga recurso='las plantillas' detalle={(e as Error).message} />;
  }
  return <PlantillaEmailManager initialData={plantillas} />;
}
