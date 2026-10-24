/** @format */

import type { ReactNode } from "react";

/** Paginas sin sesion (login): pantalla completa, sin barra ni pie. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main id='main-content' className='min-h-screen bg-background'>
      {children}
    </main>
  );
}
