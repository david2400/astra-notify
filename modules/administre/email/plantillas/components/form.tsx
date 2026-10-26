/** @format */

'use client';

import { Link, useRouter } from '@/shared/i18n/routing';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { actualizarPlantillaEmailServerAction, crearPlantillaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/plantillas/actions';
import { ejecutarAccion, vacioANull } from '../../shared/utils/feedback';
import type { OpcionSelect } from '../../shared/components/native-select';
import { FormPlantilla } from '../scenes/form-plantilla';
import type { PlantillaFormValues } from '../schemas/plantilla.schema';
import type { ICrearPlantilla, IPlantilla } from '../models/plantilla.interface';

export const toPayload = (v: PlantillaFormValues): ICrearPlantilla => ({
  codigo: v.codigo.trim().toUpperCase(),
  nombre: v.nombre.trim(),
  descripcion: vacioANull(v.descripcion),
  tipo_mensaje: vacioANull(v.tipo_mensaje),
  asunto: v.asunto.trim(),
  cuerpo_html: v.cuerpo_html.trim() ? v.cuerpo_html : null,
  cuerpo_texto: v.cuerpo_texto.trim() ? v.cuerpo_texto : null,
  variables: v.variables.map((x) => ({
    nombre: x.nombre.trim(),
    tipo_dato: x.tipo_dato,
    obligatoria: x.obligatoria,
    longitud_maxima: x.longitud_maxima ? Number(x.longitud_maxima) : null,
    patron: vacioANull(x.patron),
    valor_defecto: x.valor_defecto.trim() ? x.valor_defecto : null,
    descripcion: vacioANull(x.descripcion),
  })),
});

const VACIA: PlantillaFormValues = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_mensaje: '',
  asunto: '',
  cuerpo_html: '',
  cuerpo_texto: '',
  variables: [],
};

const RUTA = '/administre/email/plantillas';

export function PlantillaEmailEditorPage({ plantilla, tipos }: { plantilla?: IPlantilla; tipos: OpcionSelect[] }) {
  const router = useRouter();
  const volver = () => {
    router.replace(RUTA);
    router.refresh();
  };
  return (
    <section className='mx-auto w-full max-w-7xl space-y-6'>
      <Link href={RUTA} className='inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
        <HiOutlineArrowLeft className='h-4 w-4' aria-hidden='true' />
        Volver a plantillas
      </Link>
      <header className='space-y-2 border-b border-border pb-5'>
        <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>Administración Email / Plantillas</p>
        <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>{plantilla ? `Editar ${plantilla.nombre}` : 'Nueva plantilla de email'}</h1>
        <p className='text-sm text-muted-foreground'>
          {plantilla
            ? `Código ${plantilla.codigo} · Versión ${plantilla.version}. Si cambias el contenido o las variables se crea una nueva versión.`
            : 'Diseña asunto, HTML y texto, agrega variables y revisa el resultado antes de guardar.'}
        </p>
      </header>
      <div className='rounded-2xl border border-border bg-card p-4 sm:p-6'>
        {plantilla ? <UpdatePlantilla plantilla={plantilla} tipos={tipos} handleClose={volver} /> : <RegisterPlantilla tipos={tipos} handleClose={volver} />}
      </div>
    </section>
  );
}

export function RegisterPlantilla({ tipos, handleClose }: { tipos: OpcionSelect[]; handleClose: () => void }) {
  return (
    <FormPlantilla
      initialValues={VACIA}
      tipos={tipos}
      toPayload={toPayload}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => crearPlantillaEmailServerAction(toPayload(values)), {
          exito: 'Plantilla creada',
          error: 'No se pudo crear la plantilla.',
        });
        if (ok) handleClose();
      }}
    />
  );
}

export function UpdatePlantilla({ plantilla, tipos, handleClose }: { plantilla: IPlantilla; tipos: OpcionSelect[]; handleClose: () => void }) {
  return (
    <FormPlantilla
      bloquearCodigo
      tipos={tipos}
      toPayload={toPayload}
      initialValues={{
        codigo: plantilla.codigo,
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion ?? '',
        tipo_mensaje: plantilla.tipo_mensaje ?? '',
        asunto: plantilla.asunto,
        cuerpo_html: plantilla.cuerpo_html ?? '',
        cuerpo_texto: plantilla.cuerpo_texto ?? '',
        variables: [...(plantilla.variables ?? [])]
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((v) => ({
            nombre: v.nombre,
            tipo_dato: v.tipo_dato,
            obligatoria: v.obligatoria,
            longitud_maxima: v.longitud_maxima != null ? String(v.longitud_maxima) : '',
            patron: v.patron ?? '',
            valor_defecto: v.valor_defecto ?? '',
            descripcion: v.descripcion ?? '',
          })),
      }}
      onSubmit={async (values) => {
        const ok = await ejecutarAccion(() => actualizarPlantillaEmailServerAction(toPayload({ ...values, codigo: plantilla.codigo })), {
          exito: 'Plantilla actualizada',
          error: 'No se pudo actualizar la plantilla.',
        });
        if (ok) handleClose();
      }}
    />
  );
}
