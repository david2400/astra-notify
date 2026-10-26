/** @format */

'use client';

import { useRouter } from 'next/navigation';
import { actualizarCuentaEmailServerAction, crearCuentaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/cuentas/actions';
import { ejecutarAccion, vacioANull } from '../../shared/utils/feedback';
import type { OpcionSelect } from '../../shared/components/native-select';
import { FormCuenta } from '../scenes/form-cuenta';
import type { CuentaFormValues } from '../schemas/cuenta.schema';
import { CUENTA_FORM_DEFAULT, PARAMETROS_SUGERIDOS, type ICuenta, type ICrearCuenta, type ModoAuthGmail } from '../models/cuenta.interface';

interface Props {
  proveedores: OpcionSelect[];
  handleClose: () => void;
}

/** Arma el payload: authMode va en parametros (Gmail); OAuth2 se envía como un secreto JSON. */
export function toPayload(v: CuentaFormValues): ICrearCuenta {
  const parametros: Record<string, unknown> = v.parametros.trim() ? JSON.parse(v.parametros) : {};
  if (v.proveedor === 'GMAIL') parametros.authMode = v.auth_mode;
  else delete parametros.authMode;

  let clave: string | undefined;
  if (v.proveedor === 'GMAIL' && v.auth_mode === 'OAUTH2') {
    if (v.oauth_client_id && v.oauth_client_secret && v.oauth_refresh_token) {
      clave = JSON.stringify({ client_id: v.oauth_client_id, client_secret: v.oauth_client_secret, refresh_token: v.oauth_refresh_token });
    }
  } else if (v.clave) {
    clave = v.clave;
  }
  return {
    proveedor: v.proveedor,
    codigo: v.codigo.trim().toUpperCase(),
    usuario: vacioANull(v.usuario),
    secret_ref: vacioANull(v.secret_ref),
    remitente_email: v.remitente_email.trim().toLowerCase(),
    remitente_nombre: vacioANull(v.remitente_nombre),
    parametros: Object.keys(parametros).length ? parametros : null,
    // Sin clave escrita no se envía: el gateway conserva la cifrada actual.
    ...(clave && !v.eliminar_clave ? { clave } : {}),
    ...(v.eliminar_clave ? { eliminar_clave: true } : {}),
  };
}

export function RegisterCuenta({ proveedores, handleClose, proveedor }: Props & { proveedor?: string }) {
  const router = useRouter();
  return (
    <FormCuenta
      initialValues={{
        ...CUENTA_FORM_DEFAULT,
        proveedor: proveedor ?? '',
        parametros: JSON.stringify(PARAMETROS_SUGERIDOS[proveedor ?? ''] ?? {}, null, 2),
      }}
      proveedores={proveedores}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => crearCuentaEmailServerAction(toPayload(values)), {
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
  const { authMode, ...parametros } = (cuenta.parametros ?? {}) as Record<string, unknown>;
  return (
    <FormCuenta
      edicion
      claveConfigurada={cuenta.tiene_clave_cifrada}
      initialValues={{
        ...CUENTA_FORM_DEFAULT,
        proveedor: cuenta.proveedor,
        codigo: cuenta.codigo,
        usuario: cuenta.usuario ?? '',
        remitente_email: cuenta.remitente_email,
        remitente_nombre: cuenta.remitente_nombre ?? '',
        auth_mode: authMode === 'OAUTH2' ? 'OAUTH2' : ('APP_PASSWORD' as ModoAuthGmail),
        secret_ref: cuenta.secret_ref ?? '',
        parametros: JSON.stringify(parametros, null, 2),
      }}
      proveedores={proveedores}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => actualizarCuentaEmailServerAction(toPayload({ ...values, codigo: cuenta.codigo })), {
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
