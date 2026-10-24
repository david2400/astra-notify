/** @format */

import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
// import {SessionProvider} from 'next-auth/react';
// import { ReduxProvider } from "@/lib/providers/reduxProvider";
import { QueryProvider } from "@/lib/query-client";
import { routing } from "@/shared/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <QueryProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        {/* <ReduxProvider> */}
        {/* La barra y el pie van en (protected)/layout.tsx: el login ocupa toda la pantalla. */}
        {children}
        {/* </ReduxProvider> */}
      </NextIntlClientProvider>
    </QueryProvider>
  );
}
