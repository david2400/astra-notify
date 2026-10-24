/** @format */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnviosScene, type IEnvio } from '@/modules/notificaciones/envios';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Titles' });
  return { title: t('notificaciones') };
}

/**
 * Ejemplo de página protegida. Para conectar el backend, crea el dominio en
 * server/domains/notificaciones (repository + queries con serverFetch) y
 * reemplaza la lista vacía por la consulta real.
 */
export default async function EnviosPage() {
  const envios: IEnvio[] = [];
  return <EnviosScene envios={envios} />;
}
