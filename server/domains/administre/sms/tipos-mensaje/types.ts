/** Contrato de /admin/tipos-mensaje (TipoMensajeRequest / TipoMensajeResponse). */
export type CanalMensaje = 'SMS' | 'WHATSAPP';

export interface ITipoMensaje {
  id: number;
  /** Valor de tipo_mensaje en rutas y envíos (OTP, NORMAL, ...). */
  codigo: string;
  descripcion: string | null;
  canal: CanalMensaje;
  otp: boolean;
  masivo: boolean;
  eliminado: boolean;
}

export interface ICrearTipoMensaje {
  codigo: string;
  descripcion?: string | null;
  canal: CanalMensaje;
  otp?: boolean;
  masivo?: boolean;
}

export interface IActualizarTipoMensaje extends ICrearTipoMensaje {
  id: number;
}

export interface IFiltroTiposMensaje {
  canal?: CanalMensaje;
  otp?: boolean;
  masivo?: boolean;
}
