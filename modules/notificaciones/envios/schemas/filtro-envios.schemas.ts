/** @format */

import { z } from 'zod';

const texto = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

/** datetime-local (2026-10-19T08:00) → LocalDateTime ISO sin zona, como lo espera sms_gateway. */
const fechaLocal = texto.transform((v) => {
  if (!v || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(v)) return undefined;
  return v.length === 16 ? `${v}:00` : v;
});

/** Filtros del historial de SMS leídos de la URL (?destino=&estado=&page=). */
export const filtroSmsSchema = z.object({
  destino: texto,
  estado: z.enum(['EN_PROCESO', 'ENVIADO', 'FALLIDO']).optional().catch(undefined),
  tipo_mensaje: texto,
  proveedor: texto,
  desde: fechaLocal,
  hasta: fechaLocal,
  page: z.coerce.number().int().min(0).catch(0).default(0),
  size: z.coerce.number().int().min(5).max(100).catch(20).default(20),
});

export type FiltroSms = z.infer<typeof filtroSmsSchema>;
