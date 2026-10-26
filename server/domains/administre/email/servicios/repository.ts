import 'server-only';

import { emailGatewayFetch } from '@/server/lib/server-fetch';
import { cod, EMAIL_ADMIN } from '../constants';
import type { IReemplazarServicios } from './types';

export const servicioEmailRepository = {
  /** Reemplaza la lista completa (borrado físico + inserción en el gateway). Devuelve los códigos guardados. */
  reemplazar({ proveedor, tipos_mensaje }: IReemplazarServicios): Promise<string[]> {
    return emailGatewayFetch.put<string[]>(`${EMAIL_ADMIN}/proveedores/${cod(proveedor)}/servicios`, { tipos_mensaje });
  },
} as const;
