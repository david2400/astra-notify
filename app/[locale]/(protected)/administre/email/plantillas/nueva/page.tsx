import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { Link } from '@/shared/i18n/routing';
import { getTiposMensajeEmail } from '@/server/domains/administre/email/tipos-mensaje';
import { getPlantillaEmail, type IPlantilla } from '@/server/domains/administre/email/plantillas';
import { getMarcaEmailSegura } from '@/server/domains/administre/email/disenos';
import { PlantillaEmailEditorPage } from '@/modules/administre/email/plantillas/components/form';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Nueva plantilla de email' };

export default async function NuevaPlantillaEmailPage({ searchParams }: { searchParams: Promise<{ desde?: string }> }) {
  const { desde } = await searchParams;
  try {
    // ?desde=CODIGO duplica una plantilla existente
    const valido = desde && /^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/.test(desde);
    const [tipos, copiaDe, marca] = await Promise.all([
      getTiposMensajeEmail(),
      valido ? getPlantillaEmail(desde).catch(() => undefined as IPlantilla | undefined) : Promise.resolve(undefined),
      getMarcaEmailSegura(),
    ]);
    return <PlantillaEmailEditorPage copiaDe={copiaDe} marca={marca} tipos={tipos.map((t) => ({ value: t.codigo, label: t.codigo }))} />;
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
