/** @format */

'use client';

import { useRouter } from 'next/navigation';
import {
  actualizarProveedorEmailServerAction,
  crearProveedorEmailServerAction,
} from '@/app/[locale]/(protected)/administre/email/proveedores/actions';
import { ejecutarAccion } from '../../shared/utils/feedback';
import { FormProveedor } from '../scenes/form-proveedor';
import type { ProveedorFormValues } from '../schemas/proveedor.schema';
import { PROVEEDOR_FORM_DEFAULT, type IProveedor } from '../models/proveedor.interface';

interface Props {
  implementados: string[];
  handleClose: () => void;
}

const toPayload = (v: ProveedorFormValues) => ({
  codigo: v.codigo.trim().toUpperCase(),
  nombre: v.nombre.trim(),
  base_url: v.base_url.trim(),
  connect_timeout_ms: v.connect_timeout_ms,
  read_timeout_ms: v.read_timeout_ms,
});

export function RegisterProveedor({ implementados, handleClose }: Props) {
  const router = useRouter();
  return (
    <FormProveedor
      initialValues={PROVEEDOR_FORM_DEFAULT}
      implementados={implementados}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => crearProveedorEmailServerAction(toPayload(values)), {
          exito: 'Proveedor creado',
          error: 'No se pudo crear el proveedor.',
        });
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}

export function UpdateProveedor({ proveedor, implementados, handleClose }: Props & { proveedor: IProveedor }) {
  const router = useRouter();
  return (
    <FormProveedor
      bloquearCodigo
      initialValues={{
        codigo: proveedor.codigo,
        nombre: proveedor.nombre,
        base_url: proveedor.base_url,
        connect_timeout_ms: proveedor.connect_timeout_ms,
        read_timeout_ms: proveedor.read_timeout_ms,
      }}
      implementados={implementados}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(
          () => actualizarProveedorEmailServerAction(toPayload({ ...values, codigo: proveedor.codigo })),
          { exito: 'Proveedor actualizado', error: 'No se pudo actualizar el proveedor.' },
        );
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}
