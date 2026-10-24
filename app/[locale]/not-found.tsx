/** @format */

import { Link } from "@/shared/i18n/routing";
import { Layout } from "@/components/layout";

export default function NotFound() {
  return (
    <Layout>
    <section className='mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center'>
      <p className='text-xs font-semibold uppercase tracking-[0.28em] text-primary'>
        Error 404
      </p>
      <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
        No encontramos esta página
      </h1>
      <p className='max-w-lg text-sm text-muted-foreground'>
        La dirección puede haber cambiado o el registro ya no existe. Vuelve al
        inicio y continúa desde el menú principal.
      </p>
      <Link
        href='/'
        className='mt-2 inline-flex h-10 items-center justify-center rounded-[0.9rem] bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'>
        Ir al inicio
      </Link>
    </section>
    </Layout>
  );
}
