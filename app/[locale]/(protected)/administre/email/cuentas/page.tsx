/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getCuentasEmail, type ICuenta } from '@/server/domains/administre/email/cuentas';
import { getProveedoresEmail, type IProveedor } from '@/server/domains/administre/email/proveedores';
import { CuentaEmailManager } from '@/modules/administre/email/cuentas';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Cuentas Email' };

export default async function CuentasEmailPage({ searchParams }: { searchParams: Promise<{ proveedor?: string }> }) {
  const { proveedor } = await searchParams;
  let cuentas: ICuenta[] = [];
  let proveedores: IProveedor[] = [];
  try {
    [cuentas, proveedores] = await Promise.all([getCuentasEmail(proveedor || undefined), getProveedoresEmail()]);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/cuentas]', e);
    return <ErrorCarga recurso='las cuentas' detalle={(e as Error).message} />;
  }
  return <CuentaEmailManager initialData={cuentas} proveedores={proveedores} proveedor={proveedor || undefined} />;
}
