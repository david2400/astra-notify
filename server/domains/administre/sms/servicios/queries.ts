import 'server-only';
import { cache } from 'react';
import { servicioRepository } from './repository';

export const getServiciosProveedor = cache((proveedorId: number) => servicioRepository.get(proveedorId));
