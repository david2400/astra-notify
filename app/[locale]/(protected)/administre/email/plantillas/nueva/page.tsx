import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { Link } from '@/shared/i18n/routing';
import { getTiposMensajeEmail } from '@/server/domains/administre/email/tipos-mensaje';
import { PlantillaEmailEditorPage } from '@/modules/administre/email/plantillas/components/form';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Nueva plantilla de email' };

export default async function NuevaPlantillaEmailPage() {
  try {
    const tipos = await getTiposMensajeEmail();
    return <PlantillaEmailEditorPage tipos={tipos.map((t) => ({ value: t.codigo, label: t.codigo }))} />;
  } catch (error) {
    unstable_rethrow(error);
    return (
      <div className='space-y-4'>
        <Link href='/administre/email/plantillas' className='text-sm font-medium underline'>Volver a plantillas</Link>
        <ErrorCarga recurso='los tipos de mensaje' detalle={error instanceof Error ? error.message : 'No se pudo cargar el formulario.'} />
      </div>
    );
  }
}
