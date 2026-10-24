/** @format */

export type {
  IRuta,
  IPaso,
  IPasoPayload,
  ICrearRuta,
  IRutaEfectiva,
  IPasoEfectivo,
} from '@/server/domains/administre/sms/rutas/types';

/** Etiqueta de la ruta: CENTRAL (endpoint /v1/sms/send) o el proveedor. */
export const CENTRAL = 'CENTRAL';

export const PASO_DEFAULT = { cuenta_id: '', max_intentos: 3, espera_ms: 500 };
