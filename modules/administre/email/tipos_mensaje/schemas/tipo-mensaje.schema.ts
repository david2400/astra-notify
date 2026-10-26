import { z } from 'zod';

export const tipoMensajeSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Solo letras, números, _ y -'),
  descripcion: z.string().trim().max(255, 'Máximo 255 caracteres'),
  prioridad: z.coerce.number().int().min(1).max(9),
  masivo: z.boolean(),
});

export type TipoMensajeFormValues = z.infer<typeof tipoMensajeSchema>;
