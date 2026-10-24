/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getCuentas } from '@/server/domains/administre/sms/cuentas';
import type { ICuenta } from '@/server/domains/administre/sms/cuentas';
import { getProveedores } from '@/server/domains/administre/sms/proveedores';
import type { IProveedor } from '@/server/domains/administre/sms/proveedores';
import { CuentaManager } from '@/modules/administre/sms/cuentas';
import { ErrorCarga } from '@/modules/administre/sms/shared/components/error-carga';

export const metadata: Metadata = { title: 'Cuentas SMS' };

export default async function CuentasPage({ searchParams }: { searchParams: Promise<{ proveedor?: string }> }) {
  const { proveedor } = await searchParams;
  const proveedorId = Number(proveedor) > 0 ? Number(proveedor) : undefined;

  let cuentas: ICuenta[] = [];
  let proveedores: IProveedor[] = [];
  try {
    [cuentas, proveedores] = await Promise.all([getCuentas(proveedorId), getProveedores()]);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/sms/cuentas]', e);
    return <ErrorCarga recurso='las cuentas' detalle={(e as Error).message} />;
  }
  return <CuentaManager initialData={cuentas} proveedores={proveedores} proveedorId={proveedorId} />;
}
