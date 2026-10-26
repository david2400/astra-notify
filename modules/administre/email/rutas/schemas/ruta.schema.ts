import { z } from 'zod';

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
  proveedor: z.string(),
  tipo_mensaje: z.string().min(1, 'Selecciona el tipo de mensaje'),
  pasos: pasosSchema,
});

export type PasosFormValues = z.infer<typeof pasosFormSchema>;
export type RutaFormValues = z.infer<typeof rutaSchema>;
