import 'server-only';
import { cache } from 'react';
import { envioSmsRepository } from './repository';
import type { IFiltroSms } from './types';

export const buscarEnviosSms = cache((filtro: IFiltroSms) => envioSmsRepository.buscar(filtro));
