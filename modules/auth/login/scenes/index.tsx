import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@repo/ui/form/scenes";
import { useForm } from "react-hook-form";
import { IFormProps } from "@repo/ui/form/models";
import { Buttons } from "@repo/ui/buttons/scenes/index";

/** Login viejo por usuario y contraseña (solo cuando OIDC no esta configurado). */
export const FormLogin = ({ initialValues, validationSchema, onSubmit }: IFormProps<any>) => {
  type LoginInputs = z.infer<typeof validationSchema>;

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<LoginInputs>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  return (
    <>
      <div className='space-y-2'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Bienvenido de nuevo</h1>
        <p className='text-sm text-muted-foreground'>Escribe tu usuario y contraseña para entrar.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        <FormField
          id='username'
          label='Usuario'
          autoComplete='username'
          error={(errors as any)?.username?.message}
          {...register("username")}
        />
        <FormField
          id='password'
          type='password'
          label='Contraseña'
          autoComplete='current-password'
          error={(errors as any)?.password?.message}
          {...register("password")}
        />
        <Buttons
          type='submit'
          disabled={isSubmitting}
          className='h-11 w-full justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90'>
          {isSubmitting ? "Ingresando…" : "Ingresar"}
        </Buttons>
      </form>
    </>
  );
};
