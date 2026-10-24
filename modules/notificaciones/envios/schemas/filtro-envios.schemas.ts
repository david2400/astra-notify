/** @format */

import { z } from 'zod';

/** Filtros del listado de envíos (formulario de búsqueda). */
export const filtroEnviosSchema = z.object({
  destino: z.string().trim().optional(),
  estado: z.enum(['EN_PROCESO', 'ENVIADO', 'FALLIDO']).optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export type FiltroEnvios = z.infer<typeof filtroEnviosSchema>;
