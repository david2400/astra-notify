import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import { Link } from '@/shared/i18n/routing';
import { getPlantillas } from '@/server/domains/administre/sms/plantillas';
import { getTiposMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import { PlantillaEditorPage } from '@/modules/administre/sms/plantillas/components/form';
import { ErrorCarga } from '@/modules/administre/sms/shared/components/error-carga';

export const metadata: Metadata = { title: 'Editar plantilla SMS' };

export default async function EditarPlantillaPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  try {
    const [plantillas, tipos] = await Promise.all([getPlantillas(), getTiposMensaje()]);
    const plantilla = plantillas.find((item) => item.id === Number(id));
    if (!plantilla) notFound();
    return <PlantillaEditorPage plantilla={plantilla} tipos={tipos.map((tipo) => ({ value: tipo.codigo, label: tipo.codigo }))} />;
  } catch (error) {
    unstable_rethrow(error);
    return (
      <div className='space-y-4'>
        <Link href='/administre/sms/plantillas' className='text-sm font-medium underline'>Volver a plantillas</Link>
        <ErrorCarga recurso='la plantilla' detalle={error instanceof Error ? error.message : 'No se pudo cargar el formulario.'} />
      </div>
    );
  }
}
