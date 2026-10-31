'use server';

import { handleError } from '@/server/lib/handlers';
import type { ActionResult } from '@/server/lib/types/action.type';
import { envioEmailNotifRepository } from './repository';
import type { IEmailLoteResultado, IEmailResultado, IEnviarEmail, IEnviarEmailLote } from './types';

export async function enviarEmailAction(payload: IEnviarEmail): Promise<ActionResult<IEmailResultado>> {
  try {
    return { success: true, data: await envioEmailNotifRepository.enviar(payload) };
  } catch (error) {
    return handleError(error);
  }
}

export async function enviarEmailLoteAction(payload: IEnviarEmailLote): Promise<ActionResult<IEmailLoteResultado>> {
  try {
    return { success: true, data: await envioEmailNotifRepository.enviarLote(payload) };
  } catch (error) {
    return handleError(error);
  }
}
