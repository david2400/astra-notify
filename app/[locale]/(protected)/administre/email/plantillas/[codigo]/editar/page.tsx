import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import { Link } from '@/shared/i18n/routing';
import { ServerApiError } from '@/server/lib/types';
import { getPlantillaEmail } from '@/server/domains/administre/email/plantillas';
import { getTiposMensajeEmail } from '@/server/domains/administre/email/tipos-mensaje';
import { PlantillaEmailEditorPage } from '@/modules/administre/email/plantillas/components/form';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Editar plantilla de email' };

export default async function EditarPlantillaEmailPage({ params }: { params: Promise<{ codigo: string; locale: string }> }) {
  const { codigo } = await params;
  const valor = decodeURIComponent(codigo);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/.test(valor)) notFound();
  try {
    const [plantilla, tipos] = await Promise.all([getPlantillaEmail(valor), getTiposMensajeEmail()]);
    return <PlantillaEmailEditorPage plantilla={plantilla} tipos={tipos.map((t) => ({ value: t.codigo, label: t.codigo }))} />;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ServerApiError && error.status === 404) notFound();
    return (
      <div className='space-y-4'>
        <Link href='/administre/email/plantillas' className='text-sm font-medium underline'>Volver a plantillas</Link>
        <ErrorCarga recurso='la plantilla' detalle={error instanceof Error ? error.message : 'No se pudo cargar el formulario.'} />
      </div>
    );
  }
}
