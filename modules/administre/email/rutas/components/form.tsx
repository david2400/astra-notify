/** @format */

'use client';

import { useRouter } from 'next/navigation';
import { crearRutaEmailServerAction, reemplazarPasosEmailServerAction } from '@/app/[locale]/(protected)/administre/email/rutas/actions';
import type { ICuenta } from '@/server/domains/administre/email/cuentas/types';
import { ejecutarAccion } from '../../shared/utils/feedback';
import type { OpcionSelect } from '../../shared/components/native-select';
import { FormPasos, FormRuta } from '../scenes/form-ruta';
import type { PasosFormValues } from '../schemas/ruta.schema';
import type { IRuta } from '../models/ruta.interface';

/** El orden lo da la posición en la lista (1 = principal). */
const toPasos = (pasos: PasosFormValues['pasos']) =>
  pasos.map((p) => ({ cuenta: p.cuenta, max_intentos: p.max_intentos, espera_ms: p.espera_ms }));

export function RegisterRuta({
  proveedores,
  tipos,
  cuentas,
  handleClose,
}: {
  proveedores: OpcionSelect[];
  tipos: OpcionSelect[];
  cuentas: ICuenta[];
  handleClose: () => void;
}) {
  const router = useRouter();
  return (
    <FormRuta
      proveedores={proveedores}
      tipos={tipos}
      cuentas={cuentas}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(
          () =>
            crearRutaEmailServerAction({
              proveedor: values.proveedor || null,
              tipo_mensaje: values.tipo_mensaje,
              pasos: toPasos(values.pasos),
            }),
          { exito: 'Ruta guardada', error: 'No se pudo crear la ruta.' },
        );
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}

export function UpdatePasos({ ruta, cuentas, handleClose }: { ruta: IRuta; cuentas: ICuenta[]; handleClose: () => void }) {
  const router = useRouter();
  return (
    <FormPasos
      cuentas={cuentas}
      proveedor={ruta.proveedor ?? null}
      initialValues={{
        pasos: [...ruta.pasos]
          .sort((a, b) => a.orden - b.orden)
          .map((p) => ({ cuenta: p.cuenta, max_intentos: p.max_intentos, espera_ms: p.espera_ms })),
      }}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => reemplazarPasosEmailServerAction({ ruta_id: ruta.id, pasos: toPasos(values.pasos) }), {
          exito: 'Pasos actualizados',
          error: 'No se pudieron guardar los pasos.',
        });
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}
