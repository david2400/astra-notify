/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getProveedoresEmail, getProveedoresEmailImplementados, type IProveedor } from '@/server/domains/administre/email/proveedores';
import { ProveedorEmailManager } from '@/modules/administre/email/proveedores';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Proveedores Email' };

export default async function ProveedoresEmailPage() {
  let proveedores: IProveedor[] = [];
  let implementados: string[] = [];
  try {
    [proveedores, implementados] = await Promise.all([getProveedoresEmail(), getProveedoresEmailImplementados()]);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/proveedores]', e);
    return <ErrorCarga recurso='los proveedores' detalle={(e as Error).message} />;
  }
  return <ProveedorEmailManager initialData={proveedores} implementados={implementados} />;
}
