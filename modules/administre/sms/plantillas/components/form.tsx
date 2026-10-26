/** @format */

'use client';

import { Link, useRouter } from '@/shared/i18n/routing';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import {
  actualizarPlantillaServerAction,
  crearPlantillaServerAction,
} from '@/app/[locale]/(protected)/administre/sms/plantillas/actions';
import { ejecutarAccion, vacioANull } from '../../shared/utils/feedback';
import type { OpcionSelect } from '../../shared/components/native-select';
import { FormPlantilla } from '../scenes/form-plantilla';
import type { PlantillaFormValues } from '../schemas/plantilla.schema';
import type { IPlantilla } from '../models/plantilla.interface';

const toPayload = (v: PlantillaFormValues) => ({
  codigo: v.codigo.trim().toUpperCase(),
  nombre: v.nombre.trim(),
  descripcion: vacioANull(v.descripcion),
  tipo_mensaje: vacioANull(v.tipo_mensaje),
  contenido: v.contenido.trim(),
  variables: v.variables.map((x) => ({
    nombre: x.nombre.trim(),
    tipo_dato: x.tipo_dato,
    obligatoria: x.obligatoria,
    longitud_max: x.longitud_max ? Number(x.longitud_max) : null,
    patron: vacioANull(x.patron),
    valor_defecto: vacioANull(x.valor_defecto),
    descripcion: vacioANull(x.descripcion),
  })),
});

const VACIA: PlantillaFormValues = { codigo: '', nombre: '', descripcion: '', tipo_mensaje: '', contenido: '', variables: [] };

export function PlantillaEditorPage({ plantilla, tipos }: { plantilla?: IPlantilla; tipos: OpcionSelect[] }) {
  const router = useRouter();
  const volver = () => router.replace('/administre/sms/plantillas');
  return (
    <section className='mx-auto w-full max-w-7xl space-y-6'>
      <Link href='/administre/sms/plantillas' className='inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
        <HiOutlineArrowLeft className='h-4 w-4' aria-hidden='true' />
        Volver a plantillas
      </Link>
      <header className='space-y-2 border-b border-border pb-5'>
        <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>Administración SMS / Plantillas</p>
        <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>{plantilla ? `Editar ${plantilla.nombre}` : 'Nueva plantilla'}</h1>
        <p className='text-sm text-muted-foreground'>{plantilla ? `Código ${plantilla.codigo} · Versión ${plantilla.version}. Al guardar se creará una nueva versión.` : 'Diseña tu mensaje, agrega variables y revisa el resultado antes de guardar.'}</p>
      </header>
      <div className='rounded-2xl border border-border bg-card p-4 sm:p-6'>
        {plantilla ? <UpdatePlantilla plantilla={plantilla} tipos={tipos} handleClose={volver} /> : <RegisterPlantilla tipos={tipos} handleClose={volver} />}
      </div>
    </section>
  );
}

export function RegisterPlantilla({ tipos, handleClose }: { tipos: OpcionSelect[]; handleClose: () => void }) {
  const router = useRouter();
  return (
    <FormPlantilla
      initialValues={VACIA}
      tipos={tipos}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => crearPlantillaServerAction(toPayload(values)), {
          exito: 'Plantilla creada',
          error: 'No se pudo crear la plantilla.',
        });
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}

export function UpdatePlantilla({
  plantilla,
  tipos,
  handleClose,
}: {
  plantilla: IPlantilla;
  tipos: OpcionSelect[];
  handleClose: () => void;
}) {
  const router = useRouter();
  return (
    <FormPlantilla
      bloquearCodigo
      tipos={tipos}
      initialValues={{
        codigo: plantilla.codigo,
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion ?? '',
        tipo_mensaje: plantilla.tipo_mensaje ?? '',
        contenido: plantilla.contenido,
        variables: [...plantilla.variables]
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((v) => ({
            nombre: v.nombre,
            tipo_dato: v.tipo_dato,
            obligatoria: v.obligatoria,
            longitud_max: v.longitud_max != null ? String(v.longitud_max) : '',
            patron: v.patron ?? '',
            valor_defecto: v.valor_defecto ?? '',
            descripcion: v.descripcion ?? '',
          })),
      }}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(
          () => actualizarPlantillaServerAction({ id: plantilla.id, ...toPayload({ ...values, codigo: plantilla.codigo }) }),
          { exito: 'Plantilla actualizada (nueva versión)', error: 'No se pudo actualizar la plantilla.' },
        );
        if (ok) {
          handleClose();
          router.refresh();
        }
      }}
    />
  );
}
