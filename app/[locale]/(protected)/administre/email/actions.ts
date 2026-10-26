'use server';

import { refrescarCacheEmailAction } from '@/server/domains/administre/email/cache';

export async function refrescarCacheEmailServerAction() {
  return refrescarCacheEmailAction();
}
