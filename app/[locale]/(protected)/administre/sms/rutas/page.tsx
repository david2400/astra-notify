/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getRutas } from '@/server/domains/administre/sms/rutas';
import type { IRuta } from '@/server/domains/administre/sms/rutas';
import { getCuentas } from '@/server/domains/administre/sms/cuentas';
import type { ICuenta } from '@/server/domains/administre/sms/cuentas';
import { getProveedores } from '@/server/domains/administre/sms/proveedores';
import type { IProveedor } from '@/server/domains/administre/sms/proveedores';
import { getTiposMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import type { ITipoMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import { RutaManager } from '@/modules/administre/sms/rutas';
import { ErrorCarga } from '@/modules/administre/sms/shared/components/error-carga';

export const metadata: Metadata = { title: 'Rutas SMS' };

export default async function RutasPage() {
  let rutas: IRuta[] = [];
  let cuentas: ICuenta[] = [];
  let proveedores: IProveedor[] = [];
  let tipos: ITipoMensaje[] = [];
  try {
    [rutas, cuentas, proveedores, tipos] = await Promise.all([
      getRutas(),
      getCuentas(),
      getProveedores(),
      getTiposMensaje(),
    ]);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/sms/rutas]', e);
    return <ErrorCarga recurso='las rutas' detalle={(e as Error).message} />;
  }
  return <RutaManager initialData={rutas} cuentas={cuentas} proveedores={proveedores} tipos={tipos} />;
}
