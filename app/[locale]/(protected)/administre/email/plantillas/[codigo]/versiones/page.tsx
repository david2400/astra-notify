import type { Metadata } from 'next';
import { notFound, unstable_rethrow } from 'next/navigation';
import { Link } from '@/shared/i18n/routing';
import { ServerApiError } from '@/server/lib/types';
import { getHistorialPlantillaEmail, getPlantillaEmail, getVersionesPlantillaEmail } from '@/server/domains/administre/email/plantillas';
import { VersionesPlantilla } from '@/modules/administre/email/plantillas';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Versiones de plantilla' };

/** Versiones, flujo de aprobación e historial de una plantilla de email. */
export default async function VersionesPlantillaEmailPage({ params }: { params: Promise<{ codigo: string; locale: string }> }) {
  const { codigo } = await params;
  const valor = decodeURIComponent(codigo);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/.test(valor)) notFound();
  let paso = 'la plantilla';
  try {
    const plantilla = await getPlantillaEmail(valor);
    paso = 'las versiones de la plantilla';
    const [versiones, historial] = await Promise.all([getVersionesPlantillaEmail(valor), getHistorialPlantillaEmail(valor)]);
    return <VersionesPlantilla plantilla={plantilla} versiones={versiones} historial={historial} />;
  } catch (error) {
    unstable_rethrow(error);
    // Solo es "no existe" si la plantilla no existe; un 404 en /versiones o /historial es un email_gateway sin actualizar.
    if (paso === 'la plantilla' && error instanceof ServerApiError && error.status === 404) notFound();
    const sinApi = paso !== 'la plantilla' && error instanceof ServerApiError && error.status === 404;
    return (
      <div className='space-y-4'>
        <Link href='/administre/email/plantillas' className='text-sm font-medium underline'>
          Volver a plantillas
        </Link>
        <ErrorCarga
          recurso={paso}
          detalle={
            sinApi
              ? 'El email_gateway en ejecución no tiene la API de versiones (GET /v1/admin/plantillas/{codigo}/versiones). Ejecuta mysql_ejecutar_todo.sql y recompila y reinicia email_gateway y notificacion.'
              : error instanceof Error
                ? error.message
                : 'No se pudo cargar.'
          }
        />
      </div>
    );
  }
}
