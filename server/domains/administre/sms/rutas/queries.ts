import 'server-only';
import { cache } from 'react';
import { rutaRepository } from './repository';

export const getRutas = cache(() => rutaRepository.list());
