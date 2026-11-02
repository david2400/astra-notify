/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getPlantillasEmail, type IPlantilla } from '@/server/domains/administre/email/plantillas';
import { getEstadisticasPorPlantillaEmail, type IEstadisticasEnvio } from '@/server/domains/administre/email/envios';
import { periodo } from '@/modules/administre/email/seguimiento';
import { PlantillaEmailManager } from '@/modules/administre/email/plantillas';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Plantillas Email' };

export default async function PlantillasEmailPage() {
  let plantillas: IPlantilla[] = [];
  let estadisticas: IEstadisticasEnvio[] = [];
  try {
    // Las métricas son opcionales: si fallan, el listado se muestra igual.
    const [p, e] = await Promise.all([getPlantillasEmail(), getEstadisticasPorPlantillaEmail(periodo(30)).catch(() => [] as IEstadisticasEnvio[])]);
    plantillas = p;
    estadisticas = e;
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/plantillas]', e);
    return <ErrorCarga recurso='las plantillas' detalle={(e as Error).message} />;
  }
  return <PlantillaEmailManager initialData={plantillas} estadisticas={estadisticas} />;
}
