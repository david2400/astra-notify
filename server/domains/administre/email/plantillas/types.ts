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
  /** Diseño del editor visual (JSON). Solo en el detalle; null = plantilla editada como HTML. */
  diseno_json?: string | null;
  version: number;
  /** Estado de la versión actual (la última guardada). */
  estado_aprobacion?: EstadoAprobacion;
  /** Versión que se envía (null = ninguna publicada todavía). */
  version_publicada?: number | null;
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
  diseno_json?: string | null;
  variables: IPlantillaVariablePayload[];
  /** Nota de la nueva versión (queda en el historial). */
  comentario_cambio?: string | null;
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

/** Estado de una versión: solo PUBLICADA se envía. */
export type EstadoAprobacion = 'BORRADOR' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'PUBLICADA' | 'REEMPLAZADA' | 'DESCARTADA';

export type AccionFlujo = 'enviar-revision' | 'aprobar' | 'rechazar' | 'publicar';

export interface IPlantillaVersion {
  version: number;
  estado: EstadoAprobacion;
  asunto: string;
  tipo_mensaje?: string | null;
  comentario?: string | null;
  autor_id?: string | null;
  autor_nombre?: string | null;
  created_at?: string;
  revisado_por_id?: string | null;
  revisado_por_nombre?: string | null;
  revisado_at?: string | null;
  publicado_por_id?: string | null;
  publicado_por_nombre?: string | null;
  publicado_at?: string | null;
  /** Solo en el detalle de una versión. */
  cuerpo_html?: string | null;
  cuerpo_texto?: string | null;
  diseno_json?: string | null;
  variables?: IPlantillaVariablePayload[];
}

export type AccionHistorial =
  | 'CREADA' | 'EDITADA' | 'ENVIADA_REVISION' | 'APROBADA' | 'RECHAZADA' | 'PUBLICADA'
  | 'RESTAURADA' | 'ACTIVADA' | 'DESACTIVADA' | 'COMENTARIO';

export interface IPlantillaHistorial {
  version?: number | null;
  accion: AccionHistorial;
  comentario?: string | null;
  actor_id?: string | null;
  actor_nombre?: string | null;
  fecha?: string;
}

export interface IFlujoPayload {
  comentario?: string | null;
  /** Versión sobre la que se actúa: si cambió, el gateway responde 409. */
  version?: number;
}

export type ResultadoEnlace = 'OK' | 'REDIRECCION' | 'ROTO' | 'NO_VERIFICABLE' | 'BLOQUEADO' | 'ERROR';

export interface IEnlaceVerificado {
  url: string;
  resultado: ResultadoEnlace;
  status?: number | null;
  mensaje?: string | null;
  duracion_ms?: number;
}
