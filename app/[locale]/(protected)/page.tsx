/** @format */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { MenuInicio } from "@/modules/inicio/components/menu-inicio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Titles" });
  return {
    title: t("home"),
    description: "Todos los módulos de Astra Notify en un solo lugar.",
  };
}

/**
 * Pagina de inicio: todos los menus agrupados por modulo, con buscador. No llama a ningun
 * backend (carga al instante); las cifras quedaron en /panel.
 */
export default async function HomePage() {
  const session = await auth();
  const nombre = session?.user?.name ?? session?.user?.username ?? null;
  return <MenuInicio nombre={nombre} />;
}
