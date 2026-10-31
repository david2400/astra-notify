/** Catálogos de sms_gateway que necesita el formulario de envío (proyección mínima). */
import type { VariableCampo } from '../../shared';

export type { IEnviarSms, IEnviarSmsLote, ISmsResultado, ISmsLoteResultado, ISmsEnvio, IFiltroSms, IPaginaSms } from '@/server/domains/notificaciones/sms/types';

export interface OpcionTipoSms {
  codigo: string;
  descripcion: string | null;
  masivo: boolean;
  otp: boolean;
}

export interface OpcionPlantillaSms {
  codigo: string;
  nombre: string;
  contenido: string;
  tipo_mensaje: string | null;
  variables: VariableCampo[];
}

export interface OpcionProveedor {
  codigo: string;
  nombre: string;
}

/** Ruta de SMS que se puede pedir en el envío (campo `ruta`: su código o su id). */
export interface OpcionRutaSms {
  valor: string;
  etiqueta: string;
  tipo_mensaje: string;
}

export interface OpcionCuenta {
  codigo: string;
  proveedor: string;
  remitente: string | null;
}

/** Límite del formulario (notificacion admite hasta 50000 por lote; los divide en bloques). */
export const MAX_DESTINOS_SMS = 5000;

export const EJEMPLO_CSV_SMS = 'telefono,indicativo,nombre,codigo\n3001234567,57,Ana,4821\n3109876543,57,Luis,7710\n';

export const ESTADOS_SMS = [
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'FALLIDO', label: 'Fallido' },
];
