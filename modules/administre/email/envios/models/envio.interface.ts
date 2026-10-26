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
