import 'server-only';
import { cache } from 'react';
import { tipoMensajeEmailRepository } from './repository';

export const getTiposMensajeEmail = cache(() => tipoMensajeEmailRepository.list());
