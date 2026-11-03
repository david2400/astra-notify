'use server';

import {
  actualizarImagenAction,
  buscarImagenesAction,
  carpetasImagenesAction,
  eliminarImagenAction,
  estadoImagenAction,
  etiquetasImagenesAction,
  moverImagenesAction,
  subirImagenAction,
  usosImagenAction,
  type EstadoImagen,
  type IActualizarImagen,
  type IFiltroImagenes,
} from '@/server/domains/administre/imagenes';

export async function buscarImagenesServerAction(filtro: IFiltroImagenes) {
  return buscarImagenesAction(filtro);
}

export async function subirImagenServerAction(form: FormData) {
  return subirImagenAction(form);
}

export async function actualizarImagenServerAction(id: number, payload: IActualizarImagen) {
  return actualizarImagenAction(id, payload);
}

export async function moverImagenesServerAction(ids: number[], carpeta: string) {
  return moverImagenesAction(ids, carpeta);
}

export async function estadoImagenServerAction(id: number, archivada: boolean) {
  return estadoImagenAction(id, archivada);
}

export async function usosImagenServerAction(id: number) {
  return usosImagenAction(id);
}

export async function eliminarImagenServerAction(id: number) {
  return eliminarImagenAction(id);
}

export async function carpetasImagenesServerAction(estado: EstadoImagen = 'ACTIVA') {
  return carpetasImagenesAction(estado);
}

export async function etiquetasImagenesServerAction(estado: EstadoImagen = 'ACTIVA') {
  return etiquetasImagenesAction(estado);
}
