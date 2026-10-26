import 'server-only';
import { cache } from 'react';
import { rutaEmailRepository } from './repository';

export const getRutasEmail = cache(() => rutaEmailRepository.list());
