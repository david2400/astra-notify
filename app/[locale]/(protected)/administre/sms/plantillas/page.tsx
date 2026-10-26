/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getPlantillas } from '@/server/domains/administre/sms/plantillas';
import type { IPlantilla } from '@/server/domains/administre/sms/plantillas';
import { PlantillaManager } from '@/modules/administre/sms/plantillas';
import { ErrorCarga } from '@/modules/administre/sms/shared/components/error-carga';

export const metadata: Metadata = { title: 'Plantillas SMS' };

export default async function PlantillasPage() {
  let plantillas: IPlantilla[] = [];
  try {
    plantillas = await getPlantillas();
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/sms/plantillas]', e);
    return <ErrorCarga recurso='las plantillas' detalle={(e as Error).message} />;
  }
  return <PlantillaManager initialData={plantillas} />;
}
