import 'server-only';
import { cache } from 'react';
import { envioEmailRepository } from './repository';
import type { IFiltroEnvios, IFiltroEstadisticas } from './types';

export const buscarEnviosEmail = cache((filtro: IFiltroEnvios) => envioEmailRepository.buscar(filtro));
export const getEstadisticasEmail = cache((filtro: IFiltroEstadisticas) => envioEmailRepository.estadisticas(filtro));
export const getEstadisticasPorPlantillaEmail = cache((filtro: Omit<IFiltroEstadisticas, 'plantilla' | 'tz_offset'>) =>
  envioEmailRepository.estadisticasPorPlantilla(filtro),
);
export const getLoteEmail = cache((loteId: string) => envioEmailRepository.lote(loteId));
