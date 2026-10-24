/** @format */

import type { ReactNode } from "react";
import { Layout } from "@/components/layout";

/** Area con sesion: barra de navegacion, contenido y pie. */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
