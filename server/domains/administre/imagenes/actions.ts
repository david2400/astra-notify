'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { imagenesRepository } from './repository';
import type { EstadoImagen, IActualizarImagen, IConteo, IFiltroImagenes, IImagen, IPaginaImagenes, IUsosImagen } from './types';

/** Tipos que acepta la biblioteca (el backend revisa además la firma del archivo). */
const TIPOS = ['image/png', 'image/jpeg', 'image/gif'];

async function ejecutar<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await fn() };
  } catch (error) {
    return handleError(error);
  }
}

export async function buscarImagenesAction(filtro: IFiltroImagenes): Promise<ActionResult<IPaginaImagenes>> {
  return ejecutar(() => imagenesRepository.buscar(filtro));
}

export async function subirImagenAction(form: FormData): Promise<ActionResult<IImagen>> {
  const archivo = form.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) return { success: false, error: 'Adjunta una imagen' };
  if (archivo.type && !TIPOS.includes(archivo.type)) return { success: false, error: 'Solo JPG, PNG o GIF' };
  // Solo se reenvían los campos conocidos
  const limpio = new FormData();
  limpio.set('archivo', archivo, archivo.name);
  for (const campo of ['carpeta', 'etiquetas', 'alt'] as const) {
    const v = form.get(campo);
    if (typeof v === 'string' && v.trim()) limpio.set(campo, v.trim());
  }
  return ejecutar(() => imagenesRepository.subir(limpio));
}

export async function actualizarImagenAction(id: number, payload: IActualizarImagen): Promise<ActionResult<IImagen>> {
  return ejecutar(() => imagenesRepository.actualizar(id, payload));
}

export async function moverImagenesAction(ids: number[], carpeta: string): Promise<ActionResult<IImagen[]>> {
  return ejecutar(() => imagenesRepository.mover(ids, carpeta));
}

export async function estadoImagenAction(id: number, archivada: boolean): Promise<ActionResult<IImagen>> {
  return ejecutar(() => imagenesRepository.estado(id, archivada));
}

export async function usosImagenAction(id: number): Promise<ActionResult<IUsosImagen>> {
  return ejecutar(() => imagenesRepository.usos(id));
}

export async function eliminarImagenAction(id: number): Promise<ActionResult<void>> {
  return ejecutar(() => imagenesRepository.eliminar(id));
}

export async function carpetasImagenesAction(estado: EstadoImagen = 'ACTIVA'): Promise<ActionResult<IConteo[]>> {
  return ejecutar(() => imagenesRepository.carpetas(estado));
}

export async function etiquetasImagenesAction(estado: EstadoImagen = 'ACTIVA'): Promise<ActionResult<IConteo[]>> {
  return ejecutar(() => imagenesRepository.etiquetas(estado));
}
