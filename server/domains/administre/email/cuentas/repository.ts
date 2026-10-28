import 'server-only';

import { emailAdminFetch } from '@/server/lib/server-fetch';
import { cod, SIN_CACHE, type IAuditoria, type IEstadoPayload } from '../constants';
import type { IActualizarCuenta, ICrearCuenta, ICuenta, IVerificacionCuenta, ParametrosCuenta } from './types';

/** notificacion: /api/notificacion/v1/admin/email/cuentas (por código). */
const BASE = '/cuentas';

/** CuentaResponse de notificacion (remitente = dirección del remitente). */
interface ICuentaApi extends IAuditoria {
  id: number;
  proveedor: string;
  codigo: string;
  usuario?: string | null;
  secret_ref?: string | null;
  clave_configurada: boolean;
  credencial_disponible: boolean;
  remitente: string | null;
  remitente_nombre?: string | null;
  parametros?: ParametrosCuenta | null;
}

const aCuenta = ({ clave_configurada, remitente, ...c }: ICuentaApi): ICuenta => ({
  ...c,
  tiene_clave_cifrada: clave_configurada,
  remitente_email: remitente ?? '',
});

/** remitente_email de la pantalla = remitente de notificacion. */
const aRequest = ({ remitente_email, ...resto }: ICrearCuenta) => ({ ...resto, remitente: remitente_email });

export const cuentaEmailRepository = {
  async list(proveedor?: string): Promise<ICuenta[]> {
    return (await emailAdminFetch.get<ICuentaApi[]>(BASE, { ...SIN_CACHE, params: { proveedor } })).map(aCuenta);
  },
  /** La clave viaja en texto plano y notificacion la guarda cifrada con la llave de email_gateway. */
  async create(payload: ICrearCuenta): Promise<ICuenta> {
    return aCuenta(await emailAdminFetch.post<ICuentaApi>(BASE, aRequest(payload)));
  },
  async update(payload: IActualizarCuenta): Promise<ICuenta> {
    return aCuenta(await emailAdminFetch.put<ICuentaApi>(`${BASE}/${cod(payload.codigo)}`, aRequest(payload)));
  },
  async cambiarEstado(codigo: string, payload: IEstadoPayload): Promise<ICuenta> {
    return aCuenta(await emailAdminFetch.patch<ICuentaApi>(`${BASE}/${cod(codigo)}/estado`, payload));
  },
  /**
   * Probar conexión (login SMTP / API de Brevo) necesita el código del proveedor, que vive en email_gateway:
   * notificacion responde 422 OPERACION_NO_SOPORTADA y la pantalla muestra ese mensaje.
   */
  probar(codigo: string): Promise<IVerificacionCuenta> {
    return emailAdminFetch.post<IVerificacionCuenta>(`${BASE}/${cod(codigo)}/probar`);
  },
} as const;
