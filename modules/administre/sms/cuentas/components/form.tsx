/** @format */

'use client';

import { useRouter } from 'next/navigation';
import {
  actualizarCuentaServerAction,
  crearCuentaServerAction,
} from '@/app/[locale]/(protected)/administre/sms/cuentas/actions';
import { ejecutarAccion, vacioANull } from '../../shared/utils/feedback';
import type { OpcionSelect } from '../../shared/components/native-select';
import { FormCuenta } from '../scenes/form-cuenta';
import type { CuentaFormValues } from '../schemas/cuenta.schema';
import { CUENTA_FORM_DEFAULT, type ICuenta } from '../models/cuenta.interface';

interface Props {
  proveedores: OpcionSelect[];
  handleClose: () => void;
}

const parametros = (texto: string): Record<string, unknown> | null =>
  texto.trim() ? (JSON.parse(texto) as Record<string, unknown>) : null;

const toPayload = (v: CuentaFormValues) => ({
  proveedor_id: Number(v.proveedor_id),
  codigo: v.codigo.trim().toUpperCase(),
  usuario: vacioANull(v.usuario),
  secret_ref: vacioANull(v.secret_ref),
  remitente: vacioANull(v.remitente),
  parametros: parametros(v.parametros),
  // Sin clave escrita no se envía: el gateway conserva la cifrada actual.
  ...(v.clave ? { clave: v.clave } : {}),
});

export function RegisterCuenta({ proveedores, handleClose, proveedorId }: Props & { proveedorId?: number }) {
  const router = useRouter();
  return (
    <FormCuenta
      initialValues={{ ...CUENTA_FORM_DEFAULT, proveedor_id: proveedorId ? String(proveedorId) : '' }}
      proveedores={proveedores}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => crearCuentaServerAction(toPayload(values)), {
          exito: 'Cuenta creada',
          error: 'No se pudo crear la cuenta.',
        });
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}

export function UpdateCuenta({ cuenta, proveedores, handleClose }: Props & { cuenta: ICuenta }) {
  const router = useRouter();
  return (
    <FormCuenta
      edicion
      claveConfigurada={cuenta.clave_configurada}
      initialValues={{
        proveedor_id: String(cuenta.proveedor_id),
        codigo: cuenta.codigo,
        usuario: cuenta.usuario ?? '',
        clave: '',
        secret_ref: cuenta.secret_ref ?? '',
        remitente: cuenta.remitente ?? '',
        parametros: JSON.stringify(cuenta.parametros ?? {}, null, 2),
      }}
      proveedores={proveedores}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => actualizarCuentaServerAction({ id: cuenta.id, ...toPayload(values) }), {
          exito: 'Cuenta actualizada',
          error: 'No se pudo actualizar la cuenta.',
        });
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}
