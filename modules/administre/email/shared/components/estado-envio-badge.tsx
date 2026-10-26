/** @format */

import { Badge } from '@repo/ui/badges/scenes/badge';

type Variante = 'default' | 'secondary' | 'destructive' | 'outline';

const ESTADO: Record<string, Variante> = {
  ENVIADO: 'default',
  PENDIENTE: 'outline',
  EN_PROCESO: 'secondary',
  REINTENTO: 'secondary',
  FALLIDO: 'destructive',
  CANCELADO: 'outline',
};

const ENTREGA: Record<string, Variante> = {
  ENTREGADO: 'default',
  ABIERTO: 'default',
  CLIC: 'default',
  SOLICITADO: 'outline',
  DIFERIDO: 'secondary',
  REBOTE_SUAVE: 'secondary',
  DESUSCRITO: 'secondary',
  SPAM: 'destructive',
  REBOTE_DURO: 'destructive',
  INVALIDO: 'destructive',
  BLOQUEADO: 'destructive',
  ERROR: 'destructive',
};

/** Estado de procesamiento en la cola. */
export function EstadoEnvioBadge({ estado }: { estado: string }) {
  return <Badge variant={ESTADO[estado] ?? 'outline'}>{estado.replace('_', ' ')}</Badge>;
}

/** Estado de entrega reportado por el proveedor (webhooks). */
export function EstadoEntregaBadge({ estado }: { estado?: string | null }) {
  if (!estado) return <span className='text-xs text-muted-foreground'>--</span>;
  return <Badge variant={ENTREGA[estado] ?? 'outline'}>{estado.replace('_', ' ')}</Badge>;
}
