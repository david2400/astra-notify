/** @format */

export type {
  IPlantilla,
  IPlantillaVariable,
  ICrearPlantilla,
  IActualizarPlantilla,
  IPlantillaPreview,
  IErrorVariable,
  TipoDatoVariable,
} from '@/server/domains/administre/email/plantillas/types';

export const TIPOS_DATO = [
  { value: 'TEXTO', label: 'Texto' },
  { value: 'ENTERO', label: 'Entero' },
  { value: 'DECIMAL', label: 'Decimal' },
  { value: 'MONEDA', label: 'Moneda (COP)' },
  { value: 'FECHA', label: 'Fecha' },
  { value: 'HORA', label: 'Hora' },
  { value: 'URL', label: 'URL' },
];

export const VARIABLE_DEFAULT = {
  nombre: '',
  tipo_dato: 'TEXTO' as const,
  obligatoria: true,
  longitud_maxima: '',
  patron: '',
  valor_defecto: '',
  descripcion: '',
};

/** Campo de la plantilla donde se insertan variables. */
export type CampoPlantilla = 'asunto' | 'cuerpo_html' | 'cuerpo_texto';
