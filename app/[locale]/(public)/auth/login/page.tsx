/** @format */

import { Login } from "@/modules/auth/login/components/form";
import { OIDC_HABILITADO } from "@/auth";
import { rutaRetornoSegura } from "@/server/lib/ruta-retorno";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations({ locale, namespace: "Titles" });

  return {
    title: t("login"),
    description: "Acceso a la plataforma Astra Notify.",
  };
}

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ expirada?: string; callbackUrl?: string }>;
}) => {
  const { expirada, callbackUrl } = await searchParams;
  const volverA = rutaRetornoSegura(callbackUrl);
  // Con OIDC la contraseña se escribe en access_control, no en astra-notify.
  return <Login oidc={OIDC_HABILITADO} callbackUrl={volverA} expirada={Boolean(expirada)} />;
};

export default LoginPage;
