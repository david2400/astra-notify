/** @format */

export type {
  IEnvio,
  IEnvioDetalle,
  IFiltroEnvios,
  IPagina,
  IEnvioPrueba,
  IEnvioPruebaRespuesta,
  EstadoEnvio,
  EstadoEntrega,
  IEstadisticasEnvio,
  IFiltroEstadisticas,
  IPuntoSerie,
  ITotalesEnvio,
  ITasasEnvio,
} from '@/server/domains/administre/email/envios/types';

export const ESTADOS_ENVIO = ['PENDIENTE', 'EN_PROCESO', 'REINTENTO', 'ENVIADO', 'FALLIDO', 'CANCELADO'].map((v) => ({
  value: v,
  label: v.replace('_', ' '),
}));

export const ESTADOS_ENTREGA = [
  'SOLICITADO', 'DIFERIDO', 'REBOTE_SUAVE', 'ENTREGADO', 'ABIERTO', 'CLIC',
  'DESUSCRITO', 'SPAM', 'REBOTE_DURO', 'INVALIDO', 'BLOQUEADO', 'ERROR',
].map((v) => ({ value: v, label: v.replace('_', ' ') }));

export const PROVEEDORES_ENVIO = ['GMAIL', 'BREVO', 'MOCK'].map((v) => ({ value: v, label: v }));

/** Pestañas rápidas del historial (como los "logs" de Brevo): grupos de estado de entrega. */
export const GRUPOS_ENTREGA = [
  { id: 'todos', etiqueta: 'Todos', estado_entrega: '', estado: '' },
  { id: 'entregados', etiqueta: 'Entregados', estado_entrega: 'ENTREGADO,ABIERTO,CLIC,DESUSCRITO,SPAM', estado: '' },
  { id: 'abiertos', etiqueta: 'Abiertos', estado_entrega: 'ABIERTO,CLIC', estado: '' },
  { id: 'clics', etiqueta: 'Clics', estado_entrega: 'CLIC', estado: '' },
  { id: 'rebotes', etiqueta: 'Rebotes', estado_entrega: 'REBOTE_SUAVE,REBOTE_DURO,INVALIDO', estado: '' },
  { id: 'quejas', etiqueta: 'Spam y bajas', estado_entrega: 'SPAM,DESUSCRITO', estado: '' },
  { id: 'fallidos', etiqueta: 'Fallidos', estado_entrega: '', estado: 'FALLIDO' },
] as const;
