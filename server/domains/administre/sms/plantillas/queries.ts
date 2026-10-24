import 'server-only';
import { cache } from 'react';
import { plantillaRepository } from './repository';

export const getPlantillas = cache(() => plantillaRepository.list());
