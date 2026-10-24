/** @format */

import { Badge } from '@repo/ui/badges/scenes/badge';

/** Activo / Inactivo según el soft delete del gateway (eliminado = true ⇒ inactivo). */
export function EstadoBadge({ eliminado }: { eliminado: boolean }) {
  return eliminado ? <Badge variant='destructive'>Inactivo</Badge> : <Badge variant='default'>Activo</Badge>;
}

/** Sí/No compacto para columnas booleanas. */
export function SiNoBadge({ valor, si = 'Sí', no = 'No' }: { valor: boolean; si?: string; no?: string }) {
  return valor ? <Badge variant='secondary'>{si}</Badge> : <Badge variant='outline'>{no}</Badge>;
}
