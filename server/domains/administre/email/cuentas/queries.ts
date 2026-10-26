import 'server-only';
import { cache } from 'react';
import { cuentaEmailRepository } from './repository';

export const getCuentasEmail = cache((proveedor?: string) => cuentaEmailRepository.list(proveedor));
