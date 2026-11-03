import 'server-only';

import { notificacionFetch } from '@/server/lib/server-fetch';
import type { EstadoImagen, IActualizarImagen, IConteo, IFiltroImagenes, IImagen, IPaginaImagenes, IUsosImagen } from './types';

const BASE = '/v1/imagenes';
const SIN_CACHE = { revalidate: 0 } as const;

export const imagenesRepository = {
  buscar(filtro: IFiltroImagenes): Promise<IPaginaImagenes> {
    return notificacionFetch.get<IPaginaImagenes>(BASE, { ...SIN_CACHE, params: { ...filtro } });
  },

  obtener(id: number): Promise<IImagen> {
    return notificacionFetch.get<IImagen>(`${BASE}/${id}`, SIN_CACHE);
  },

  /** FormData con "archivo" y opcionales "carpeta", "etiquetas" (separadas por coma) y "alt". */
  subir(form: FormData): Promise<IImagen> {
    return notificacionFetch.post<IImagen>(BASE, form);
  },

  actualizar(id: number, payload: IActualizarImagen): Promise<IImagen> {
    return notificacionFetch.put<IImagen>(`${BASE}/${id}`, payload);
  },

  mover(ids: number[], carpeta: string): Promise<IImagen[]> {
    return notificacionFetch.post<IImagen[]>(`${BASE}/mover`, { ids, carpeta });
  },

  estado(id: number, archivada: boolean): Promise<IImagen> {
    return notificacionFetch.patch<IImagen>(`${BASE}/${id}/estado`, { archivada });
  },

  usos(id: number): Promise<IUsosImagen> {
    return notificacionFetch.get<IUsosImagen>(`${BASE}/${id}/usos`, SIN_CACHE);
  },

  eliminar(id: number): Promise<void> {
    return notificacionFetch.delete<void>(`${BASE}/${id}`);
  },

  carpetas(estado: EstadoImagen = 'ACTIVA'): Promise<IConteo[]> {
    return notificacionFetch.get<IConteo[]>(`${BASE}/carpetas`, { ...SIN_CACHE, params: { estado } });
  },

  etiquetas(estado: EstadoImagen = 'ACTIVA'): Promise<IConteo[]> {
    return notificacionFetch.get<IConteo[]>(`${BASE}/etiquetas`, { ...SIN_CACHE, params: { estado } });
  },
} as const;
