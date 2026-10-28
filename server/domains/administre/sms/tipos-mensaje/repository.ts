import 'server-only';

import { smsAdminFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, type IEstadoPayload } from '../constants';
import { catalogoSms, cod, type ITipoMensajeApi } from '../notificacion';
import type {
  CanalMensaje,
  IActualizarTipoMensaje,
  ICrearTipoMensaje,
  IFiltroTiposMensaje,
  ITipoMensaje,
} from './types';

/** Tipos de mensaje de SMS en notificacion (/admin/sms/tipos-mensaje, por código). */
const BASE = '/tipos-mensaje';

export const aTipoMensaje = (t: ITipoMensajeApi): ITipoMensaje => ({
  id: t.id,
  codigo: t.codigo,
  descripcion: t.descripcion ?? null,
  canal: (t.canal_mensaje as CanalMensaje) ?? 'SMS',
  otp: Boolean(t.otp),
  masivo: Boolean(t.masivo),
  eliminado: t.eliminado,
});

/** canal (SMS | WHATSAPP) de la pantalla = canal_mensaje de notificacion. */
const aRequest = ({ canal, ...resto }: ICrearTipoMensaje) => ({ ...resto, canal_mensaje: canal });

async function codigoDe(id: number): Promise<string> {
  return (await catalogoSms({ tipos: true })).codigoTipo(id);
}

export const tipoMensajeRepository = {
  async list(filtro: IFiltroTiposMensaje = {}): Promise<ITipoMensaje[]> {
    const params = { canal_mensaje: filtro.canal, otp: filtro.otp, masivo: filtro.masivo };
    return (await smsAdminFetch.get<ITipoMensajeApi[]>(BASE, { ...SIN_CACHE, params })).map(aTipoMensaje);
  },

  async create(payload: ICrearTipoMensaje): Promise<ITipoMensaje> {
    return aTipoMensaje(await smsAdminFetch.post<ITipoMensajeApi>(BASE, aRequest(payload)));
  },

  /** El código no se puede cambiar (notificacion responde 400). */
  async update({ id, ...payload }: IActualizarTipoMensaje): Promise<ITipoMensaje> {
    return aTipoMensaje(await smsAdminFetch.put<ITipoMensajeApi>(`${BASE}/${cod(await codigoDe(id))}`, aRequest(payload)));
  },

  /** 409 si alguna ruta o servicio lo usa. */
  async delete(id: number): Promise<void> {
    await smsAdminFetch.delete<void>(`${BASE}/${cod(await codigoDe(id))}`);
  },

  async cambiarEstado(id: number, payload: IEstadoPayload): Promise<ITipoMensaje> {
    return aTipoMensaje(await smsAdminFetch.patch<ITipoMensajeApi>(`${BASE}/${cod(await codigoDe(id))}/estado`, payload));
  },
} as const;
