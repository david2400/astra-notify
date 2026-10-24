"use client"
import {SubmitHandler} from 'react-hook-form';
import {signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import Swal from 'sweetalert2';
import {validation} from '../schemas/login.schemas';
import {ILogin} from '../models/login';
import {FormLogin} from '@modules/auth/login/scenes';
import {useFormStatus} from 'react-dom';
import {HiArrowRight, HiOutlineLockClosed} from 'react-icons/hi2';
import {iniciarSesionOidc} from '@/server/domains/auth/contexto';
import {AuthShell, AvisoSesionVencida} from './auth-shell';

function BotonContinuar() {
  const {pending} = useFormStatus();
  return (
    <button
      type='submit'
      disabled={pending}
      className='group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80'>
      {pending ? (
        <>
          <span className='h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground' aria-hidden='true' />
          Redirigiendo…
        </>
      ) : (
        <>
          Continuar con Essenza
          <HiArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' aria-hidden='true' />
        </>
      )}
    </button>
  );
}

/**
 * Con OIDC (AUTH_ACCESS_CONTROL_SECRET definida) astra-notify no pide la contraseña: manda al
 * usuario a access_control, que autentica, muestra el selector de empresa y devuelve.
 */
export const Login = ({
  oidc = false,
  callbackUrl,
  expirada = false,
}: {
  oidc?: boolean;
  callbackUrl?: string;
  expirada?: boolean;
}) => {
  const router = useRouter();
  const initialValues: ILogin = {
    username: '',
    password: '',
  };

  // Login real contra access_control (via next-auth, ver auth.ts). La
  // credencial NO debe registrarse en ningún log.
  const onSubmit: SubmitHandler<ILogin> = async (values: ILogin, event) => {
    const result = await signIn('credentials', {
      username: values.username,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      Swal.fire({
        title: 'No se pudo iniciar sesión',
        text: 'Usuario o contraseña incorrectos',
        icon: 'error',
      });
      return;
    }

    event?.target.reset();
    router.push(callbackUrl ?? '/');
    router.refresh();
  };

  const validationSchema = validation();
  if (oidc) {
    return (
      <AuthShell>
        <div className='space-y-2'>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Bienvenido de nuevo</h1>
          <p className='text-sm text-muted-foreground'>Inicia sesión para entrar a la plataforma.</p>
        </div>
        {expirada && <AvisoSesionVencida />}
        <form action={iniciarSesionOidc} className='space-y-4'>
          <input type='hidden' name='callbackUrl' value={callbackUrl ?? '/'} />
          <BotonContinuar />
        </form>
        <div className='flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground'>
          <HiOutlineLockClosed className='mt-0.5 h-4 w-4 shrink-0 text-primary' aria-hidden='true' />
          <p>
            Escribirás tu usuario y contraseña en el portal seguro de Essenza. Si trabajas en varias
            empresas, allí eliges con cuál entrar.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {expirada && <AvisoSesionVencida />}
      <FormLogin onSubmit={onSubmit} initialValues={initialValues} validationSchema={validationSchema} />
    </AuthShell>
  );
};
