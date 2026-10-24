/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getProveedores, getProveedoresImplementados } from '@/server/domains/administre/sms/proveedores';
import type { IProveedor } from '@/server/domains/administre/sms/proveedores';
import { ProveedorManager } from '@/modules/administre/sms/proveedores';
import { ErrorCarga } from '@/modules/administre/sms/shared/components/error-carga';

export const metadata: Metadata = { title: 'Proveedores SMS' };

export default async function ProveedoresPage() {
  let proveedores: IProveedor[] = [];
  let implementados: string[] = [];
  let error: string | null = null;
  try {
    [proveedores, implementados] = await Promise.all([getProveedores(), getProveedoresImplementados()]);
  } catch (e) {
    unstable_rethrow(e);
    error = (e as Error).message;
    console.error('[administre/sms/proveedores]', e);
  }
  if (error) return <ErrorCarga recurso='los proveedores' detalle={error} />;
  return <ProveedorManager initialData={proveedores} implementados={implementados} />;
}
