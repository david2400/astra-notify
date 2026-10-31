import 'server-only';

import { smsAdminFetch } from '@/server/lib/server-fetch';
import { ServerApiError } from '@/server/lib/types';
import { SIN_CACHE } from './constants';

/**
 * Contrato de la administración de SMS en notificacion (/api/notificacion/v1/admin/sms), en snake_case.
 * notificacion identifica proveedores, cuentas y tipos de mensaje por CÓDIGO (las rutas por id); las pantallas de
 * /administre/sms trabajan con ids. Los repositorios de este dominio traducen entre ambos con {@link catalogoSms}.
 */
export interface IAuditoriaApi {
  eliminado: boolean;
  usr_crea?: number | null;
  usr_mod?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IProveedorApi extends IAuditoriaApi {
  canal: 'SMS';
  id: number;
  codigo: string;
  nombre: string;
  base_url: string;
  connect_timeout_ms: number;
  read_timeout_ms: number;
  implementado: boolean;
  cuentas: number;
  servicios: string[];
}

export interface ICuentaApi extends IAuditoriaApi {
  canal: 'SMS';
  id: number;
  /** Código del proveedor. */
  proveedor: string;
  codigo: string;
  usuario: string | null;
  secret_ref: string | null;
  clave_configurada: boolean;
  /** null: notificacion no puede verificarlo (la variable vive en el entorno de sms_gateway). */
  secret_definido: boolean | null;
  credencial_disponible: boolean;
  remitente: string | null;
  parametros: Record<string, unknown> | null;
  rutas: number[];
}

export interface ITipoMensajeApi extends IAuditoriaApi {
  canal: 'SMS';
  id: number;
  codigo: string;
  descripcion: string | null;
  /** SMS | WHATSAPP */
  canal_mensaje: string;
  otp: boolean | null;
  masivo: boolean | null;
}

export interface IPasoApi {
  orden: number;
  cuenta: string;
  proveedor: string;
  max_intentos: number;
  espera_ms: number;
  activo: boolean;
}

export interface IRutaApi extends IAuditoriaApi {
  canal: 'SMS';
  id: number;
  codigo?: string | null;
  /** CENTRAL o código del proveedor. */
  proveedor: string;
  central: boolean;
  tipo_mensaje: string;
  pasos: IPasoApi[];
}

export interface IServiciosApi {
  canal: 'SMS';
  proveedor: string;
  tipos_mensaje: string[];
}

/** Código para la URL de notificacion. */
export const cod = (codigo: string) => encodeURIComponent(codigo);

export const noEncontrado = (que: string) =>
  new ServerApiError({ message: `No existe ${que}`, status: 404, code: 'NO_ENCONTRADO' });

/**
 * Proveedores, cuentas y tipos de mensaje leídos una vez por operación para traducir id ↔ código.
 * Solo se piden las listas que la operación necesita.
 */
export async function catalogoSms(
  incluir: { proveedores?: boolean; cuentas?: boolean; tipos?: boolean } = { proveedores: true, cuentas: true, tipos: true },
) {
  const [proveedores, cuentas, tipos] = await Promise.all([
    incluir.proveedores ? smsAdminFetch.get<IProveedorApi[]>('/proveedores', SIN_CACHE) : Promise.resolve([]),
    incluir.cuentas ? smsAdminFetch.get<ICuentaApi[]>('/cuentas', SIN_CACHE) : Promise.resolve([]),
    incluir.tipos ? smsAdminFetch.get<ITipoMensajeApi[]>('/tipos-mensaje', SIN_CACHE) : Promise.resolve([]),
  ]);
  const porCodigo = <T extends { codigo: string; id: number }>(l: T[]) => new Map(l.map((x) => [x.codigo, x.id]));
  const porId = <T extends { codigo: string; id: number }>(l: T[]) => new Map(l.map((x) => [x.id, x.codigo]));
  const idProveedor = porCodigo(proveedores);
  const codProveedor = porId(proveedores);
  const idCuenta = porCodigo(cuentas);
  const codCuenta = porId(cuentas);
  const idTipo = porCodigo(tipos);
  const codTipo = porId(tipos);
  const exigir = <K, V>(m: Map<K, V>, k: K, que: string): V => {
    const v = m.get(k);
    if (v === undefined) throw noEncontrado(`${que} ${String(k)}`);
    return v;
  };
  return {
    proveedores,
    cuentas,
    tipos,
    proveedorId: (codigo: string | null | undefined) => (codigo ? idProveedor.get(codigo) ?? null : null),
    cuentaId: (codigo: string) => idCuenta.get(codigo) ?? 0,
    tipoId: (codigo: string) => idTipo.get(codigo) ?? 0,
    codigoProveedor: (id: number) => exigir(codProveedor, id, 'el proveedor'),
    codigoCuenta: (id: number) => exigir(codCuenta, id, 'la cuenta'),
    codigoTipo: (id: number) => exigir(codTipo, id, 'el tipo de mensaje'),
  };
}

export type CatalogoSms = Awaited<ReturnType<typeof catalogoSms>>;
