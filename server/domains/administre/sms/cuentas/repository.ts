import 'server-only';

import { smsAdminFetch } from '@/server/lib/server-fetch';
import { SIN_CACHE, type IEstadoPayload } from '../constants';
import { catalogoSms, cod, noEncontrado, type CatalogoSms, type ICuentaApi } from '../notificacion';
import type { IActualizarCuenta, ICrearCuenta, ICuenta, IFiltroCuentas } from './types';

/** Cuentas de SMS en notificacion (/admin/sms/cuentas, por código; el proveedor va por código). */
const BASE = '/cuentas';

export const aCuenta = (c: ICuentaApi, cat: Pick<CatalogoSms, 'proveedorId'>): ICuenta => ({
  id: c.id,
  proveedor_id: cat.proveedorId(c.proveedor) ?? 0,
  proveedor_codigo: c.proveedor,
  codigo: c.codigo,
  usuario: c.usuario ?? null,
  secret_ref: c.secret_ref ?? null,
  secret_definido: c.secret_definido ?? null,
  clave_configurada: c.clave_configurada,
  credencial_disponible: c.credencial_disponible,
  remitente: c.remitente ?? null,
  parametros: c.parametros ?? null,
  rutas: c.rutas ?? [],
  eliminado: c.eliminado,
});

const aRequest = ({ proveedor_id, ...resto }: ICrearCuenta, cat: CatalogoSms) => ({
  ...resto,
  proveedor: cat.codigoProveedor(proveedor_id),
});

export const cuentaRepository = {
  async list(filtro: IFiltroCuentas = {}): Promise<ICuenta[]> {
    const cat = await catalogoSms({ proveedores: true });
    const proveedor = filtro.proveedor_id ? cat.codigoProveedor(filtro.proveedor_id) : undefined;
    const filas = await smsAdminFetch.get<ICuentaApi[]>(BASE, { ...SIN_CACHE, params: { proveedor } });
    return filas.map((c) => aCuenta(c, cat));
  },

  async getById(id: number): Promise<ICuenta> {
    const c = (await cuentaRepository.list()).find((x) => x.id === id);
    if (!c) throw noEncontrado(`la cuenta ${id}`);
    return c;
  },

  /** La clave viaja en texto plano y notificacion la guarda cifrada con la llave de sms_gateway. */
  async create(payload: ICrearCuenta): Promise<ICuenta> {
    const cat = await catalogoSms({ proveedores: true });
    return aCuenta(await smsAdminFetch.post<ICuentaApi>(BASE, aRequest(payload, cat)), cat);
  },

  /** Sin clave se conserva la actual. El código no se puede cambiar. */
  async update({ id, ...payload }: IActualizarCuenta): Promise<ICuenta> {
    const cat = await catalogoSms({ proveedores: true, cuentas: true });
    const codigo = cat.codigoCuenta(id);
    return aCuenta(await smsAdminFetch.put<ICuentaApi>(`${BASE}/${cod(codigo)}`, aRequest(payload, cat)), cat);
  },

  async cambiarEstado(id: number, payload: IEstadoPayload): Promise<ICuenta> {
    const cat = await catalogoSms({ proveedores: true, cuentas: true });
    return aCuenta(await smsAdminFetch.patch<ICuentaApi>(`${BASE}/${cod(cat.codigoCuenta(id))}/estado`, payload), cat);
  },
} as const;
