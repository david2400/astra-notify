import 'server-only';
import { cache } from 'react';
import { proveedorRepository } from './repository';

export const getProveedores = cache(() => proveedorRepository.list());
export const getProveedorById = cache((id: number) => proveedorRepository.getById(id));
export const getProveedoresImplementados = cache(() => proveedorRepository.implementados());
