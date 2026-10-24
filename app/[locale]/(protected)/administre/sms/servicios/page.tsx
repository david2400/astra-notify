/** @format */

import type { Metadata } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { getProveedores } from '@/server/domains/administre/sms/proveedores';
import type { IProveedor } from '@/server/domains/administre/sms/proveedores';
import { getTiposMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import type { ITipoMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import { getServiciosProveedor } from '@/server/domains/administre/sms/servicios';
import type { IServiciosProveedor } from '@/server/domains/administre/sms/servicios';
import { ServiciosManager } from '@/modules/administre/sms/servicios';
import { ErrorCarga } from '@/modules/administre/sms/shared/components/error-carga';

export const metadata: Metadata = { title: 'Servicios por proveedor' };

export default async function ServiciosPage({ searchParams }: { searchParams: Promise<{ proveedor?: string }> }) {
  const { proveedor } = await searchParams;

  let proveedores: IProveedor[] = [];
  let tipos: ITipoMensaje[] = [];
  let servicios: IServiciosProveedor | null = null;
  try {
    [proveedores, tipos] = await Promise.all([getProveedores(), getTiposMensaje()]);
    // Sin ?proveedor se muestra el primero.
    const seleccionado = proveedores.find((p) => String(p.id) === proveedor) ?? proveedores[0];
    if (seleccionado) servicios = await getServiciosProveedor(seleccionado.id);
  } catch (e) {
    unstable_rethrow(e);
    console.error('[administre/sms/servicios]', e);
    return <ErrorCarga recurso='los servicios' detalle={(e as Error).message} />;
  }
  return <ServiciosManager proveedores={proveedores} tipos={tipos} servicios={servicios} />;
}
