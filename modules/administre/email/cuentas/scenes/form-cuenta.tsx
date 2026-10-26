/** @format */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@repo/ui/form/scenes/form-field';
import { FormTextAreaField } from '@repo/ui/form/scenes/form-area';
import { Buttons } from '@repo/ui/buttons/scenes';
import { CheckField } from '../../shared/components/check-field';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { AYUDA_PARAMETROS, PARAMETROS_SUGERIDOS } from '../models/cuenta.interface';
import { cuentaSchema, type CuentaFormValues } from '../schemas/cuenta.schema';

interface Props {
  initialValues: CuentaFormValues;
  proveedores: OpcionSelect[];
  edicion?: boolean;
  /** En edición: si ya hay clave cifrada guardada. */
  claveConfigurada?: boolean;
  onSubmit: (values: CuentaFormValues) => Promise<void>;
}

export function FormCuenta({ initialValues, proveedores, edicion, claveConfigurada, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CuentaFormValues>({ resolver: zodResolver(cuentaSchema), defaultValues: initialValues });
  const proveedor = watch('proveedor');
  const modo = watch('auth_mode');
  const eliminarClave = watch('eliminar_clave');
  const gmail = proveedor === 'GMAIL';
  const oauth = gmail && modo === 'OAUTH2';
  const conservar = edicion && claveConfigurada ? ' (vacío = conservar la actual)' : '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-12 gap-4'>
        <NativeSelect
          id='proveedor'
          label='Proveedor'
          placeholder='Selecciona...'
          opciones={proveedores}
          disabled={edicion}
          className='col-span-12 md:col-span-5'
          error={errors.proveedor?.message}
          {...register('proveedor')}
        />
        <FormField
          id='codigo'
          label='Código'
          placeholder='Ej. GMAIL_NOTIFICACIONES'
          disabled={edicion}
          className='col-span-12 md:col-span-7'
          error={errors.codigo?.message}
          {...register('codigo')}
        />
        <FormField
          id='remitente_email'
          label='Remitente (From)'
          placeholder='notificaciones@midominio.com'
          description={gmail ? 'La misma cuenta Gmail o un alias verificado.' : 'Debe ser un remitente verificado en el proveedor.'}
          className='col-span-12 md:col-span-7'
          error={errors.remitente_email?.message}
          {...register('remitente_email')}
        />
        <FormField
          id='remitente_nombre'
          label='Nombre del remitente'
          placeholder='Ej. Notificaciones'
          className='col-span-12 md:col-span-5'
          error={errors.remitente_nombre?.message}
          {...register('remitente_nombre')}
        />

        {gmail ? (
          <>
            <FormField
              id='usuario'
              label='Usuario SMTP (cuenta Gmail)'
              placeholder='cuenta@gmail.com o env:GMAIL_USERNAME'
              description="Vacío = el remitente. Con 'env:NOMBRE' se lee del entorno del gateway."
              className='col-span-12 md:col-span-7'
              error={errors.usuario?.message}
              {...register('usuario')}
            />
            <NativeSelect
              id='auth_mode'
              label='Autenticación'
              opciones={[
                { value: 'APP_PASSWORD', label: 'Contraseña de aplicación' },
                { value: 'OAUTH2', label: 'OAuth2 (XOAUTH2)' },
              ]}
              className='col-span-12 md:col-span-5'
              {...register('auth_mode')}
            />
          </>
        ) : null}

        {oauth ? (
          <div className='col-span-12 grid grid-cols-12 gap-4 rounded-xl border border-border/70 p-4'>
            <p className='col-span-12 text-sm text-muted-foreground'>
              Credenciales OAuth2 de Google (scope https://mail.google.com/). Se guardan cifradas como un solo secreto{conservar}.
            </p>
            <FormField id='oauth_client_id' label='client_id' className='col-span-12' error={errors.oauth_client_id?.message} {...register('oauth_client_id')} />
            <FormField
              id='oauth_client_secret'
              type='password'
              autoComplete='new-password'
              label='client_secret'
              className='col-span-12 md:col-span-6'
              error={errors.oauth_client_secret?.message}
              {...register('oauth_client_secret')}
            />
            <FormField
              id='oauth_refresh_token'
              type='password'
              autoComplete='new-password'
              label='refresh_token'
              className='col-span-12 md:col-span-6'
              error={errors.oauth_refresh_token?.message}
              {...register('oauth_refresh_token')}
            />
          </div>
        ) : (
          <FormField
            id='clave'
            type='password'
            autoComplete='new-password'
            label={gmail ? 'Contraseña de aplicación' : proveedor === 'BREVO' ? 'API key (xkeysib-...)' : 'Clave / secreto'}
            placeholder={edicion && claveConfigurada ? '•••••• (vacío = conservar la actual)' : 'Se guarda cifrada'}
            description='Se guarda cifrada (AES-256-GCM) y nunca se vuelve a mostrar.'
            className='col-span-12 md:col-span-6'
            disabled={eliminarClave}
            error={errors.clave?.message}
            {...register('clave')}
          />
        )}
        <FormField
          id='secret_ref'
          label='Variable de entorno del secreto (opcional)'
          placeholder={proveedor === 'BREVO' ? 'Ej. BREVO_API_KEY' : 'Ej. GMAIL_APP_PASSWORD'}
          description='Alternativa a guardar la clave cifrada.'
          className={`col-span-12 ${oauth ? '' : 'md:col-span-6'}`}
          error={errors.secret_ref?.message}
          {...register('secret_ref')}
        />
        {edicion && claveConfigurada ? (
          <CheckField id='eliminar_clave' label='Borrar la clave cifrada guardada' className='col-span-12' {...register('eliminar_clave')} />
        ) : null}

        <div className='col-span-12 space-y-2'>
          <FormTextAreaField
            id='parametros'
            label='Parámetros (JSON)'
            rows={5}
            classNameInput='font-mono text-xs'
            description={AYUDA_PARAMETROS}
            error={errors.parametros?.message}
            {...register('parametros')}
          />
          {PARAMETROS_SUGERIDOS[proveedor] ? (
            <Buttons
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setValue('parametros', JSON.stringify(PARAMETROS_SUGERIDOS[proveedor], null, 2), { shouldValidate: true })}>
              Usar parámetros sugeridos para {proveedor}
            </Buttons>
          ) : null}
        </div>
      </div>
      <Buttons type='submit' loading={isSubmitting} className='w-full'>
        Guardar
      </Buttons>
    </form>
  );
}
