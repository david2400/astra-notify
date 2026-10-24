/** @format */

/** Canal por el que sale la notificación. */
export type CanalEnvio = 'SMS' | 'WHATSAPP' | 'EMAIL';

/** Estado final del envío (mismos valores que el log del gateway). */
export type EstadoEnvio = 'EN_PROCESO' | 'ENVIADO' | 'FALLIDO';

/** Fila del listado de envíos. */
export interface IEnvio {
  envioId: string;
  canal: CanalEnvio;
  destino: string;
  estado: EstadoEnvio;
  proveedor: string | null;
  fechaCreacion: string;
}
