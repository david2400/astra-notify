import 'server-only';
import { cache } from 'react';
import { tipoMensajeRepository } from './repository';

export const getTiposMensaje = cache(() => tipoMensajeRepository.list());
