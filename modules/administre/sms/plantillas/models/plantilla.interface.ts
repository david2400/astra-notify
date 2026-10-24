/** @format */

export type {
  IPlantilla,
  IPlantillaVariable,
  ICrearPlantilla,
  IActualizarPlantilla,
  IPlantillaPreview,
  TipoDatoVariable,
} from '@/server/domains/administre/sms/plantillas/types';

export const TIPOS_DATO = [
  { value: 'TEXTO', label: 'Texto' },
  { value: 'ENTERO', label: 'Entero' },
  { value: 'DECIMAL', label: 'Decimal' },
  { value: 'MONEDA', label: 'Moneda' },
  { value: 'FECHA', label: 'Fecha' },
  { value: 'HORA', label: 'Hora' },
  { value: 'URL', label: 'URL' },
];

export const VARIABLE_DEFAULT = {
  nombre: '',
  tipo_dato: 'TEXTO' as const,
  obligatoria: true,
  longitud_max: '',
  patron: '',
  valor_defecto: '',
  descripcion: '',
};
