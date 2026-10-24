import { z } from 'zod';

export const tipoMensajeSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[A-Za-z0-9_]+$/, 'Solo letras, números y _'),
  descripcion: z.string().trim().max(255, 'Máximo 255 caracteres'),
  canal: z.enum(['SMS', 'WHATSAPP'], { errorMap: () => ({ message: 'Selecciona el canal' }) }),
  otp: z.boolean(),
  masivo: z.boolean(),
});

export type TipoMensajeFormValues = z.infer<typeof tipoMensajeSchema>;

export const TIPO_MENSAJE_FORM_DEFAULT: TipoMensajeFormValues = {
  codigo: '',
  descripcion: '',
  canal: 'SMS',
  otp: false,
  masivo: false,
};
