import type { IAuditoria } from '../constants';

/** Contrato de /admin/plantillas y /admin/plantillas/{codigo}/preview. */
export type TipoDatoVariable = 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'MONEDA' | 'FECHA' | 'HORA' | 'URL';

export interface IPlantillaVariable {
  id?: number;
  nombre: string;
  tipo_dato: TipoDatoVariable;
  obligatoria: boolean;
  longitud_maxima?: number | null;
  patron?: string | null;
  valor_defecto?: string | null;
  descripcion?: string | null;
  orden?: number;
}

export interface IPlantilla extends IAuditoria {
  id: number;
  /** Único, en mayúsculas; no se puede cambiar. */
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  /** Tipo de mensaje por defecto (ausente = lo define el request). */
  tipo_mensaje?: string | null;
  /** Asunto con variables {{nombre}} (sin saltos de línea). */
  asunto: string;
  /** HTML con variables: los valores se escapan al renderizar. El listado no lo incluye. */
  cuerpo_html?: string | null;
  cuerpo_texto?: string | null;
  version: number;
  /** El listado no incluye variables; el detalle (GET /{codigo}) sí. */
  variables?: IPlantillaVariable[];
  variables_usadas?: string[];
  /** Declaradas que no se usan (advertencia: el gateway igual guarda). */
  variables_sin_usar?: string[];
}

export interface IPlantillaVariablePayload {
  nombre: string;
  tipo_dato?: TipoDatoVariable;
  obligatoria?: boolean;
  longitud_maxima?: number | null;
  patron?: string | null;
  valor_defecto?: string | null;
  descripcion?: string | null;
}

export interface ICrearPlantilla {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_mensaje?: string | null;
  asunto: string;
  cuerpo_html?: string | null;
  cuerpo_texto?: string | null;
  variables: IPlantillaVariablePayload[];
}

export type IActualizarPlantilla = ICrearPlantilla;

export interface IErrorVariable {
  variable?: string;
  codigo: string;
  mensaje: string;
}

export interface IPrevisualizarPlantilla {
  codigo: string;
  variables: Record<string, string>;
  /** Definición sin guardar (vista previa del editor). */
  borrador?: ICrearPlantilla;
}

export interface IPlantillaPreview {
  valido: boolean;
  asunto?: string;
  html?: string;
  texto?: string;
  errores?: IErrorVariable[];
  variables_sin_usar?: string[];
}
