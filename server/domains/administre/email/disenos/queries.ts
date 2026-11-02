import 'server-only';
import { cache } from 'react';
import { disenoEmailRepository } from './repository';
import type { IMarca } from './types';

/** Marca por defecto si el gateway no responde (el editor sigue funcionando). */
export const MARCA_DEFECTO: IMarca = {
  id: null,
  nombre_empresa: 'Mi empresa',
  logo_ancho: 160,
  color_primario: '#1e3a8a',
  color_secundario: '#2563eb',
  color_texto: '#1f2937',
  color_fondo: '#ffffff',
  color_fondo_exterior: '#f1f5f9',
  fuente: 'Arial, Helvetica, sans-serif',
  redes_json: '[]',
};

export const getMarcaEmail = cache(() => disenoEmailRepository.marca());
export const getComponentesEmail = cache((incluirInactivos: boolean) => disenoEmailRepository.componentes(incluirInactivos));
/** Igual que getMarcaEmail, pero nunca falla (las pantallas del editor no dependen de la marca). */
export const getMarcaEmailSegura = cache(() => disenoEmailRepository.marca().catch(() => MARCA_DEFECTO));
