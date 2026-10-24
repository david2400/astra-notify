import { z } from 'zod';

export const pasoSchema = z.object({
  cuenta_id: z.string().min(1, 'Selecciona la cuenta'),
  max_intentos: z.coerce.number().int('Entero').min(1, 'Mínimo 1').max(10, 'Máximo 10'),
  espera_ms: z.coerce.number().int('Entero').min(0, 'Mínimo 0').max(60000, 'Máximo 60000'),
});

const pasosSchema = z
  .array(pasoSchema)
  .min(1, 'Agrega al menos un paso')
  .refine((pasos) => new Set(pasos.map((p) => p.cuenta_id)).size === pasos.length, 'Una cuenta solo puede aparecer una vez');

/** Edición de pasos de una ruta existente. */
export const pasosFormSchema = z.object({ pasos: pasosSchema });

/** Creación: proveedor ('' = central), tipo de mensaje y pasos iniciales. */
export const rutaSchema = z.object({
  proveedor_id: z.string(),
  tipo_mensaje_id: z.string().min(1, 'Selecciona el tipo de mensaje'),
  pasos: pasosSchema,
});

export type PasosFormValues = z.infer<typeof pasosFormSchema>;
export type RutaFormValues = z.infer<typeof rutaSchema>;
