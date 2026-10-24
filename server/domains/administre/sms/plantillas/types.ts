/** Contrato de /admin/plantillas y /plantillas/{codigo}/previsualizar. */
export type TipoDatoVariable = 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'MONEDA' | 'FECHA' | 'HORA' | 'URL';

export interface IPlantillaVariable {
  nombre: string;
  tipo_dato: TipoDatoVariable;
  obligatoria: boolean;
  longitud_max: number | null;
  patron: string | null;
  valor_defecto: string | null;
  descripcion: string | null;
  orden?: number;
}

export interface IPlantilla {
  id: number;
  /** Único, en mayúsculas; no se puede cambiar. */
  codigo: string;
  nombre: string;
  descripcion: string | null;
  /** Tipo de mensaje por defecto (null = lo define el request). */
  tipo_mensaje: string | null;
  /** Texto con variables {{nombre}}. */
  contenido: string;
  version: number;
  variables: IPlantillaVariable[];
  eliminado: boolean;
}

export interface IPlantillaVariablePayload {
  nombre: string;
  tipo_dato?: TipoDatoVariable;
  obligatoria?: boolean;
  longitud_max?: number | null;
  patron?: string | null;
  valor_defecto?: string | null;
  descripcion?: string | null;
}

export interface ICrearPlantilla {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_mensaje?: string | null;
  contenido: string;
  variables: IPlantillaVariablePayload[];
}

export interface IActualizarPlantilla extends ICrearPlantilla {
  id: number;
}

export interface IPrevisualizarPlantilla {
  codigo: string;
  variables: Record<string, string>;
}

export interface IPlantillaPreview {
  plantilla: string;
  version: number;
  tipo_mensaje: string | null;
  texto: string;
  /** Longitud en unidades de la codificación. */
  longitud: number;
  /** GSM7 (160 por SMS) o UCS2 (70 por SMS, p. ej. con tildes). */
  codificacion: 'GSM7' | 'UCS2';
  /** SMS facturables que ocupa. */
  partes: number;
}
