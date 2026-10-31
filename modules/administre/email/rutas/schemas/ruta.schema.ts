import { z } from 'zod';

/** Código opcional para pedir la ruta en el envío (campo `ruta`): A-Z, 0-9, _ y -, no solo números. */
export const codigoRutaSchema = z
  .string()
  .trim()
  .max(50, 'Máximo 50 caracteres')
  .regex(/^([A-Za-z0-9][A-Za-z0-9_-]*)?$/, 'Use letras, números, _ y - (empezando por letra o número)')
  .refine((v) => !/^\d+$/.test(v), 'No puede ser solo números (se confundiría con el id de la ruta)');

export const pasoSchema = z.object({
  cuenta: z.string().min(1, 'Selecciona la cuenta'),
  max_intentos: z.coerce.number().int('Entero').min(1, 'Mínimo 1').max(10, 'Máximo 10'),
  espera_ms: z.coerce.number().int('Entero').min(0, 'Mínimo 0').max(600000, 'Máximo 600000'),
});

const pasosSchema = z
  .array(pasoSchema)
  .min(1, 'Agrega al menos un paso')
  .refine((pasos) => new Set(pasos.map((p) => p.cuenta)).size === pasos.length, 'Una cuenta solo puede aparecer una vez');

/** Edición de pasos de una ruta existente. */
export const pasosFormSchema = z.object({ pasos: pasosSchema });

/** Creación: proveedor ('' = CENTRAL), tipo de mensaje y pasos. */
export const rutaSchema = z.object({
  codigo: codigoRutaSchema,
  proveedor: z.string(),
  tipo_mensaje: z.string().min(1, 'Selecciona el tipo de mensaje'),
  pasos: pasosSchema,
});

export type PasosFormValues = z.infer<typeof pasosFormSchema>;
export type RutaFormValues = z.infer<typeof rutaSchema>;
