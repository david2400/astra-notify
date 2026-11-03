/** Contrato de notificacion /v1/imagenes (biblioteca de imágenes propias, archivos en S3). */
export type EstadoImagen = 'ACTIVA' | 'ARCHIVADA';

export interface IImagen {
  id: number;
  uuid: string;
  nombre: string;
  alt?: string | null;
  /** Carpeta lógica ("" = raíz). */
  carpeta: string;
  etiquetas: string[];
  tipo_contenido: string;
  extension: string;
  bytes: number;
  ancho?: number | null;
  alto?: number | null;
  /** URL pública permanente para los correos. */
  url: string;
  estado: EstadoImagen;
  creado_por_nombre?: string | null;
  created_at?: string;
  updated_at?: string | null;
  /** Solo al subir: ya existía el mismo archivo. */
  duplicada?: boolean | null;
}

export interface IPaginaImagenes {
  contenido: IImagen[];
  pagina: number;
  tamano: number;
  total: number;
}

export interface IFiltroImagenes {
  q?: string;
  /** undefined = todas; "" = raíz. */
  carpeta?: string;
  etiqueta?: string;
  estado?: EstadoImagen;
  page?: number;
  size?: number;
}

export interface IConteo {
  nombre: string;
  cantidad: number;
}

export interface IActualizarImagen {
  nombre?: string;
  alt?: string | null;
  carpeta?: string;
  etiquetas?: string[];
}

export type TipoUsoImagen = 'PLANTILLA' | 'COMPONENTE' | 'MARCA';

export interface IUsosImagen {
  verificado: boolean;
  usos: { tipo: TipoUsoImagen; codigo: string; nombre: string; detalle?: string | null }[];
  mensaje?: string | null;
}
