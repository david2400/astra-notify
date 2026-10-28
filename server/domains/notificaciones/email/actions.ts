'use server';

import { handleError } from '@/server/lib/handlers';
import { ServerApiError } from '@/server/lib/types';
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

/** Un lote rechazado (422) trae los errores por destinatario: se devuelven como dato para mostrarlos. */
export async function enviarEmailLoteAction(payload: IEnviarEmailLote): Promise<ActionResult<IEmailLoteResultado>> {
  try {
    return { success: true, data: await envioEmailNotifRepository.enviarLote(payload) };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 422) {
      const body = error.details as Partial<IEmailLoteResultado> | undefined;
      if (body && typeof body === 'object' && Array.isArray(body.errores) && typeof body.total === 'number') {
        return { success: true, data: body as IEmailLoteResultado };
      }
    }
    return handleError(error);
  }
}
