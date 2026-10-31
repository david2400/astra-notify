import 'server-only';

import { smsAdminFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, type IEstadoPayload } from '../constants';
import { catalogoSms, type CatalogoSms, type IRutaApi } from '../notificacion';
import type {
  ICrearRuta,
  IFiltroRutaEfectiva,
  IFiltroRutas,
  IPasoPayload,
  IReemplazarPasos,
  IRuta,
  IRutaEfectiva,
} from './types';

/** Rutas de SMS en notificacion (/admin/sms/rutas, por id; proveedor, tipo y cuentas por código). */
const BASE = '/rutas';

export const aRuta = (r: IRutaApi, cat: CatalogoSms): IRuta => ({
  id: r.id,
  codigo: r.codigo ?? null,
  proveedor_id: r.central ? null : cat.proveedorId(r.proveedor),
  proveedor_codigo: r.central ? 'CENTRAL' : r.proveedor,
  tipo_mensaje_id: cat.tipoId(r.tipo_mensaje),
  tipo_mensaje: r.tipo_mensaje,
  pasos: (r.pasos ?? []).map((p) => ({
    orden: p.orden,
    cuenta_id: cat.cuentaId(p.cuenta),
    cuenta_codigo: p.cuenta,
    proveedor_codigo: p.proveedor,
    max_intentos: p.max_intentos,
    espera_ms: p.espera_ms,
  })),
  eliminado: r.eliminado,
});

/** Pasos en el orden de fallback, con la cuenta por código. */
const aPasos = (pasos: IPasoPayload[] = [], cat: CatalogoSms) =>
  [...pasos]
    .sort((a, b) => a.orden - b.orden)
    .map((p) => ({ cuenta: cat.codigoCuenta(p.cuenta_id), max_intentos: p.max_intentos, espera_ms: p.espera_ms }));

export const rutaRepository = {
  async list(filtro: IFiltroRutas = {}): Promise<IRuta[]> {
    const cat = await catalogoSms();
    const params = {
      proveedor: filtro.proveedor_id ? cat.codigoProveedor(filtro.proveedor_id) : undefined,
      central: filtro.central,
      tipo_mensaje: filtro.tipo_mensaje,
    };
    const filas = await smsAdminFetch.get<IRutaApi[]>(BASE, { ...SIN_CACHE, params });
    return filas.map((r) => aRuta(r, cat));
  },

  /** Si existe una ruta inactiva para (proveedor | central, tipo) notificacion la reactiva con estos pasos. */
  async create(payload: ICrearRuta): Promise<IRuta> {
    const cat = await catalogoSms();
    const body = {
      codigo: payload.codigo || null,
      proveedor: payload.proveedor_id ? cat.codigoProveedor(payload.proveedor_id) : null,
      tipo_mensaje: cat.codigoTipo(payload.tipo_mensaje_id),
      pasos: aPasos(payload.pasos, cat),
    };
    return aRuta(await smsAdminFetch.post<IRutaApi>(BASE, body), cat);
  },

  async reemplazarPasos({ ruta_id, pasos }: IReemplazarPasos): Promise<IRuta> {
    const cat = await catalogoSms();
    return aRuta(await smsAdminFetch.put<IRutaApi>(`${BASE}/${ruta_id}/pasos`, { pasos: aPasos(pasos, cat) }), cat);
  },

  /** PUT /rutas/{id}/codigo: null quita el código. */
  async cambiarCodigo(id: number, codigo: string | null): Promise<IRuta> {
    const cat = await catalogoSms();
    return aRuta(await smsAdminFetch.put<IRutaApi>(`${BASE}/${id}/codigo`, { codigo }), cat);
  },

  async delete(id: number): Promise<void> {
    await smsAdminFetch.delete<void>(`${BASE}/${id}`);
  },

  async cambiarEstado(id: number, payload: IEstadoPayload): Promise<IRuta> {
    const cat = await catalogoSms();
    return aRuta(await smsAdminFetch.patch<IRutaApi>(`${BASE}/${id}/estado`, payload), cat);
  },

  /** La ruta tal como la usará el motor de sms_gateway, con advertencias (cuentas sin credenciales, etc.). */
  efectiva(filtro: IFiltroRutaEfectiva): Promise<IRutaEfectiva> {
    return smsAdminFetch.get<IRutaEfectiva>(`${BASE}/efectiva`, { ...SIN_CACHE, params: { ...filtro } });
  },
} as const;
