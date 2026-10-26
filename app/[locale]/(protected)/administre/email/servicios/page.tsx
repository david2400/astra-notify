/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getProveedoresEmail, type IProveedor } from '@/server/domains/administre/email/proveedores';
import { getTiposMensajeEmail, type ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje';
import { ServiciosEmailManager } from '@/modules/administre/email/servicios';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Servicios por proveedor Email' };

export default async function ServiciosEmailPage({ searchParams }: { searchParams: Promise<{ proveedor?: string }> }) {
  const { proveedor } = await searchParams;
  let proveedores: IProveedor[] = [];
  let tipos: ITipoMensaje[] = [];
  try {
    [proveedores, tipos] = await Promise.all([getProveedoresEmail(), getTiposMensajeEmail()]);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/servicios]', e);
    return <ErrorCarga recurso='los servicios' detalle={(e as Error).message} />;
  }
  const seleccionado = proveedores.find((p) => p.codigo === proveedor) ?? proveedores[0] ?? null;
  return <ServiciosEmailManager proveedores={proveedores} tipos={tipos} proveedor={seleccionado} />;
}
