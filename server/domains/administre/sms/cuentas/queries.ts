import 'server-only';
import { cache } from 'react';
import { cuentaRepository } from './repository';

export const getCuentas = cache((proveedorId?: number) =>
  cuentaRepository.list(proveedorId ? { proveedor_id: proveedorId } : {}),
);
export const getCuentaById = cache((id: number) => cuentaRepository.getById(id));
