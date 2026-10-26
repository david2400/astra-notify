/** @format */

export type { IRuta, IPaso, IPasoPayload, ICrearRuta, IRutaEfectiva } from '@/server/domains/administre/email/rutas/types';
export { CENTRAL } from '../../shared/utils/secciones';

/** espera_ms es la base del backoff exponencial (2 s, 4 s, 8 s...). */
export const PASO_DEFAULT = { cuenta: '', max_intentos: 3, espera_ms: 2000 };
