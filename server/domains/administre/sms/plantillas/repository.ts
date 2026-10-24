import 'server-only';

import { smsGatewayFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, SMS_ADMIN, type IEstadoPayload } from '../constants';
import type {
  IActualizarPlantilla,
  ICrearPlantilla,
  IPlantilla,
  IPlantillaPreview,
  IPrevisualizarPlantilla,
} from './types';

const BASE = `${SMS_ADMIN}/plantillas`;

export const plantillaRepository = {
  list(): Promise<IPlantilla[]> {
    return smsGatewayFetch.get<IPlantilla[]>(BASE, SIN_CACHE);
  },

  create(payload: ICrearPlantilla): Promise<IPlantilla> {
    return smsGatewayFetch.post<IPlantilla>(BASE, payload);
  },

  update({ id, ...payload }: IActualizarPlantilla): Promise<IPlantilla> {
    return smsGatewayFetch.put<IPlantilla>(`${BASE}/${id}`, payload);
  },

  cambiarEstado(id: number, payload: IEstadoPayload): Promise<IPlantilla> {
    return smsGatewayFetch.patch<IPlantilla>(`${BASE}/${id}/estado`, payload);
  },

  /** Renderiza la plantilla con las variables y calcula codificación y partes. */
  previsualizar({ codigo, variables }: IPrevisualizarPlantilla): Promise<IPlantillaPreview> {
    return smsGatewayFetch.post<IPlantillaPreview>(
      `/plantillas/${encodeURIComponent(codigo)}/previsualizar`,
      { variables },
    );
  },
} as const;
