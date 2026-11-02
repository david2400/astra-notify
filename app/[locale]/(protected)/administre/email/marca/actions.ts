'use server';

import {
  actualizarComponenteEmailAction,
  archivarComponenteEmailAction,
  crearComponenteEmailAction,
  guardarMarcaEmailAction,
  listarComponentesEmailAction,
  type IGuardarComponente,
  type IGuardarMarca,
} from '@/server/domains/administre/email/disenos';

export async function listarComponentesEmailServerAction(incluirInactivos = false) {
  return listarComponentesEmailAction(incluirInactivos);
}

export async function crearComponenteEmailServerAction(payload: IGuardarComponente) {
  return crearComponenteEmailAction(payload);
}

export async function actualizarComponenteEmailServerAction(id: number, payload: IGuardarComponente) {
  return actualizarComponenteEmailAction(id, payload);
}

export async function archivarComponenteEmailServerAction(id: number, eliminado: boolean) {
  return archivarComponenteEmailAction(id, eliminado);
}

export async function guardarMarcaEmailServerAction(payload: IGuardarMarca) {
  return guardarMarcaEmailAction(payload);
}
