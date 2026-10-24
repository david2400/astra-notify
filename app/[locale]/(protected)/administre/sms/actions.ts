'use server';

import { refrescarCacheRutasAction } from '@/server/domains/administre/sms/cache';

export async function refrescarCacheRutasServerAction() {
  return refrescarCacheRutasAction();
}
