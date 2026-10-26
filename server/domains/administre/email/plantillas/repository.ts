import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import { cod, EMAIL_ADMIN, SIN_CACHE, type IEstadoPayload } from '../constants';
import type { IActualizarPlantilla, ICrearPlantilla, IPlantilla, IPlantillaPreview, IPrevisualizarPlantilla } from './types';

const BASE = `${EMAIL_ADMIN}/plantillas`;

export const plantillaEmailRepository = {
  /** Resumen (sin cuerpo ni variables). */
  list(): Promise<IPlantilla[]> {
    return emailGatewayFetch.get<IPlantilla[]>(BASE, SIN_CACHE);
  },

  get(codigo: string): Promise<IPlantilla> {
    return emailGatewayFetch.get<IPlantilla>(`${BASE}/${cod(codigo)}`, SIN_CACHE);
  },

  create(payload: ICrearPlantilla): Promise<IPlantilla> {
    return emailGatewayFetch.post<IPlantilla>(BASE, payload);
  },

  update(payload: IActualizarPlantilla): Promise<IPlantilla> {
    return emailGatewayFetch.put<IPlantilla>(`${BASE}/${cod(payload.codigo)}`, payload);
  },

  cambiarEstado(codigo: string, payload: IEstadoPayload): Promise<IPlantilla> {
    return emailGatewayFetch.patch<IPlantilla>(`${BASE}/${cod(codigo)}/estado`, payload);
  },

  /** Renderiza con variables (de la plantilla guardada o del borrador). Nunca falla por variables: las devuelve en `errores`. */
  previsualizar({ codigo, variables, borrador }: IPrevisualizarPlantilla): Promise<IPlantillaPreview> {
    return emailGatewayFetch.post<IPlantillaPreview>(`${BASE}/${cod(codigo || 'BORRADOR')}/preview`, { variables, borrador });
  },
} as const;
