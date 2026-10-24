/** @format */

export type {
  ITipoMensaje,
  ICrearTipoMensaje,
  IActualizarTipoMensaje,
  CanalMensaje,
} from '@/server/domains/administre/sms/tipos-mensaje/types';

export const CANALES = [
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];
