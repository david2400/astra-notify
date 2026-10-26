import 'server-only';
import { cache } from 'react';
import { plantillaEmailRepository } from './repository';

export const getPlantillasEmail = cache(() => plantillaEmailRepository.list());
export const getPlantillaEmail = cache((codigo: string) => plantillaEmailRepository.get(codigo));
