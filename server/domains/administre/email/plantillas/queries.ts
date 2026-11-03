import 'server-only';
import { cache } from 'react';
import { plantillaEmailRepository } from './repository';

export const getPlantillasEmail = cache(() => plantillaEmailRepository.list());
export const getPlantillaEmail = cache((codigo: string) => plantillaEmailRepository.get(codigo));
export const getVersionesPlantillaEmail = cache((codigo: string) => plantillaEmailRepository.versiones(codigo));
export const getHistorialPlantillaEmail = cache((codigo: string) => plantillaEmailRepository.historial(codigo));
