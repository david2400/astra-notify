import 'server-only';
import { cache } from 'react';
import { envioEmailRepository } from './repository';
import type { IFiltroEnvios } from './types';

export const buscarEnviosEmail = cache((filtro: IFiltroEnvios) => envioEmailRepository.buscar(filtro));
export const getLoteEmail = cache((loteId: string) => envioEmailRepository.lote(loteId));
