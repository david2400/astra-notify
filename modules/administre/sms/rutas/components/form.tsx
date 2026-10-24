/** @format */

'use client';

import { useRouter } from 'next/navigation';
import {
  crearRutaServerAction,
  reemplazarPasosServerAction,
} from '@/app/[locale]/(protected)/administre/sms/rutas/actions';
import type { ICuenta } from '@/server/domains/administre/sms/cuentas/types';
import { ejecutarAccion } from '../../shared/utils/feedback';
import type { OpcionSelect } from '../../shared/components/native-select';
import { FormPasos, FormRuta } from '../scenes/form-ruta';
import type { PasosFormValues } from '../schemas/ruta.schema';
import type { IRuta } from '../models/ruta.interface';

/** El orden lo da la posición en la lista (1 = principal). */
const toPasos = (pasos: PasosFormValues['pasos']) =>
  pasos.map((p, i) => ({ orden: i + 1, cuenta_id: Number(p.cuenta_id), max_intentos: p.max_intentos, espera_ms: p.espera_ms }));

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
            crearRutaServerAction({
              proveedor_id: values.proveedor_id ? Number(values.proveedor_id) : null,
              tipo_mensaje_id: Number(values.tipo_mensaje_id),
              pasos: toPasos(values.pasos),
            }),
          { exito: 'Ruta creada', error: 'No se pudo crear la ruta.' },
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
      proveedorId={ruta.proveedor_id}
      initialValues={{
        pasos: [...ruta.pasos]
          .sort((a, b) => a.orden - b.orden)
          .map((p) => ({ cuenta_id: String(p.cuenta_id), max_intentos: p.max_intentos, espera_ms: p.espera_ms })),
      }}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => reemplazarPasosServerAction({ ruta_id: ruta.id, pasos: toPasos(values.pasos) }), {
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
