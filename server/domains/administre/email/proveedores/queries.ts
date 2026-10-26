import 'server-only';
import { cache } from 'react';
import { proveedorEmailRepository } from './repository';

export const getProveedoresEmail = cache(() => proveedorEmailRepository.list());
export const getProveedoresEmailImplementados = cache(() => proveedorEmailRepository.implementados());
