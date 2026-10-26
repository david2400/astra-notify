/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getRutasEmail, type IRuta } from '@/server/domains/administre/email/rutas';
import { getCuentasEmail, type ICuenta } from '@/server/domains/administre/email/cuentas';
import { getProveedoresEmail, type IProveedor } from '@/server/domains/administre/email/proveedores';
import { getTiposMensajeEmail, type ITipoMensaje } from '@/server/domains/administre/email/tipos-mensaje';
import { RutaEmailManager } from '@/modules/administre/email/rutas';
import { ErrorCarga } from '@/modules/administre/email/shared';

export const metadata: Metadata = { title: 'Rutas Email' };

export default async function RutasEmailPage() {
  let rutas: IRuta[] = [];
  let cuentas: ICuenta[] = [];
  let proveedores: IProveedor[] = [];
  let tipos: ITipoMensaje[] = [];
  try {
    [rutas, cuentas, proveedores, tipos] = await Promise.all([
      getRutasEmail(),
      getCuentasEmail(),
      getProveedoresEmail(),
      getTiposMensajeEmail(),
    ]);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/email/rutas]', e);
    return <ErrorCarga recurso='las rutas' detalle={(e as Error).message} />;
  }
  return <RutaEmailManager initialData={rutas} cuentas={cuentas} proveedores={proveedores} tipos={tipos} />;
}
