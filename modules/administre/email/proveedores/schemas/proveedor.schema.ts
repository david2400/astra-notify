import { z } from 'zod';

export const proveedorSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Solo letras, números, _ y -'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  // GMAIL usa un host SMTP (smtp.gmail.com), no una URL http
  base_url: z.string().trim().min(1, 'La URL base / host es obligatoria').max(255),
  connect_timeout_ms: z.coerce.number().int('Debe ser entero').min(100, 'Mínimo 100 ms').max(120000, 'Máximo 120000 ms'),
  read_timeout_ms: z.coerce.number().int('Debe ser entero').min(100, 'Mínimo 100 ms').max(300000, 'Máximo 300000 ms'),
});

export type ProveedorFormValues = z.infer<typeof proveedorSchema>;
