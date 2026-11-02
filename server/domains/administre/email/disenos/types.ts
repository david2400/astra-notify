import type { IAuditoria } from '../constants';

/** Contrato de /admin/componentes y /admin/marca (email_gateway, por el proxy de notificacion). */
export type CategoriaComponente = 'ENCABEZADO' | 'CONTENIDO' | 'ACCION' | 'DATOS' | 'PIE' | 'OTRO';

export interface IComponente extends IAuditoria {
  id: number;
  nombre: string;
  categoria: CategoriaComponente;
  descripcion?: string | null;
  /** {"version":1,"bloques":[...]} del editor visual. */
  contenido_json: string;
}

export interface IGuardarComponente {
  nombre: string;
  categoria: CategoriaComponente;
  descripcion?: string | null;
  contenido_json: string;
}

export interface IRedMarca {
  red: string;
  url: string;
}

export interface IMarca extends Partial<IAuditoria> {
  /** null = aún no se ha guardado (valores por defecto del gateway). */
  id?: number | null;
  codigo?: string;
  nombre_empresa: string;
  logo_url?: string | null;
  logo_ancho?: number | null;
  color_primario: string;
  color_secundario: string;
  color_texto: string;
  color_fondo: string;
  color_fondo_exterior: string;
  fuente: string;
  direccion?: string | null;
  sitio_web?: string | null;
  telefono?: string | null;
  email_contacto?: string | null;
  /** Texto legal del pie (HTML simple). */
  pie_legal?: string | null;
  /** JSON: IRedMarca[] */
  redes_json?: string | null;
}

export type IGuardarMarca = Omit<IMarca, keyof IAuditoria | 'id' | 'codigo'>;
