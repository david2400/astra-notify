import 'server-only';

import { emailAdminFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, type IEstadoPayload } from '../constants';
import type { ICrearRuta, IFiltroRutaEfectiva, IReemplazarPasos, IRuta, IRutaEfectiva } from './types';

/** notificacion: /api/notificacion/v1/admin/email/rutas (por id; proveedor, tipo y cuentas por código). */
const BASE = '/rutas';

/** RutaResponse de notificacion: proveedor = 'CENTRAL' en la ruta central. */
interface IRutaApi extends Omit<IRuta, 'proveedor'> {
  proveedor: string;
  central: boolean;
}

interface IRutaEfectivaApi {
  tipo_mensaje: string;
  proveedor?: string | null;
  proveedor_preferido?: string | null;
  cuenta?: string | null;
  configurada: boolean;
  codigo_error?: string | null;
  detalle?: string | null;
  pasos?: {
    orden: number;
    cuenta: string;
    proveedor: string;
    max_intentos: number;
    espera_ms: number;
    credenciales_ok?: boolean | null;
    implementado?: boolean | null;
  }[];
}

const aRuta = ({ central, proveedor, ...r }: IRutaApi): IRuta => ({ ...r, proveedor: central ? null : proveedor });

const aEfectiva = (e: IRutaEfectivaApi): IRutaEfectiva => ({
  tipo_mensaje: e.tipo_mensaje,
  proveedor: e.proveedor ?? undefined,
  proveedor_preferido: e.proveedor_preferido ?? undefined,
  cuenta: e.cuenta ?? undefined,
  ok: e.configurada,
  codigo_error: e.codigo_error ?? undefined,
  detalle: e.detalle ?? undefined,
  pasos: (e.pasos ?? []).map((p) => ({
    orden: p.orden,
    cuenta: p.cuenta,
    proveedor: p.proveedor,
    max_intentos: p.max_intentos,
    espera_ms: p.espera_ms,
    // el planner ya omite cuentas/proveedores inactivos: lo que queda en el plan está activo
    activo: true,
  })),
});

export const rutaEmailRepository = {
  async list(): Promise<IRuta[]> {
    return (await emailAdminFetch.get<IRutaApi[]>(BASE, SIN_CACHE)).map(aRuta);
  },
  /** Crea la ruta; si existe una inactiva para (proveedor, tipo) notificacion la reactiva con estos pasos. */
  async create(payload: ICrearRuta): Promise<IRuta> {
    return aRuta(await emailAdminFetch.post<IRutaApi>(BASE, payload));
  },
  async reemplazarPasos({ ruta_id, pasos }: IReemplazarPasos): Promise<IRuta> {
    return aRuta(await emailAdminFetch.put<IRutaApi>(`${BASE}/${ruta_id}/pasos`, { pasos }));
  },
  /** PUT /rutas/{id}/codigo: null quita el código. */
  async cambiarCodigo(id: number, codigo: string | null): Promise<IRuta> {
    return aRuta(await emailAdminFetch.put<IRutaApi>(`${BASE}/${id}/codigo`, { codigo }));
  },

  async cambiarEstado(id: number, payload: IEstadoPayload): Promise<IRuta> {
    return aRuta(await emailAdminFetch.patch<IRutaApi>(`${BASE}/${id}/estado`, payload));
  },
  /** Simula el planner de email_gateway: qué cuentas y en qué orden usaría un envío. */
  async efectiva(filtro: IFiltroRutaEfectiva): Promise<IRutaEfectiva> {
    return aEfectiva(await emailAdminFetch.get<IRutaEfectivaApi>(`${BASE}/efectiva`, { ...SIN_CACHE, params: { ...filtro } }));
  },
} as const;
