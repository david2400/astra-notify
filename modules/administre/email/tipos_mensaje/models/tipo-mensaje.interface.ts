/** @format */

export type { ITipoMensaje, ICrearTipoMensaje, IActualizarTipoMensaje } from '@/server/domains/administre/email/tipos-mensaje/types';

export const PRIORIDADES = Array.from({ length: 9 }, (_, i) => ({
  value: String(i + 1),
  label: i === 0 ? '1 — máxima' : i === 8 ? '9 — mínima' : String(i + 1),
}));
