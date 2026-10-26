import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { Link } from '@/shared/i18n/routing';
import { getTiposMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import { PlantillaEditorPage } from '@/modules/administre/sms/plantillas/components/form';
import { ErrorCarga } from '@/modules/administre/sms/shared/components/error-carga';

export const metadata: Metadata = { title: 'Nueva plantilla SMS' };

export default async function NuevaPlantillaPage() {
  try {
    const tipos = await getTiposMensaje();
    return <PlantillaEditorPage tipos={tipos.map((tipo) => ({ value: tipo.codigo, label: tipo.codigo }))} />;
  } catch (error) {
    unstable_rethrow(error);
    return (
      <div className='space-y-4'>
        <Link href='/administre/sms/plantillas' className='text-sm font-medium underline'>Volver a plantillas</Link>
        <ErrorCarga recurso='los tipos de mensaje' detalle={error instanceof Error ? error.message : 'No se pudo cargar el formulario.'} />
      </div>
    );
  }
}
