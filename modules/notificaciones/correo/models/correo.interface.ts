/** Catálogos de email_gateway para el formulario de envío y utilidades de direcciones. */
export type {
  IEnviarEmail,
  IEnviarEmailLote,
  IEmailResultado,
  IEmailLoteResultado,
  IDireccionEmail,
  IAdjuntoEmail,
} from '@/server/domains/notificaciones/email/types';
import type { IDireccionEmail } from '@/server/domains/notificaciones/email/types';

export interface OpcionTipoCorreo {
  codigo: string;
  descripcion: string | null;
}

export interface OpcionPlantillaCorreo {
  codigo: string;
  nombre: string;
  asunto: string;
  tipo_mensaje: string | null;
}

export interface OpcionProveedorCorreo {
  codigo: string;
  nombre: string;
}

export interface OpcionCuentaCorreo {
  codigo: string;
  proveedor: string;
  remitente: string;
}

/** Mismos límites que email.core.limits del gateway. */
export const LIMITES_CORREO = {
  destinatariosPorCorreo: 50,
  lote: 5000,
  adjuntoBytes: 10 * 1024 * 1024,
  adjuntosTotalBytes: 20 * 1024 * 1024,
  asunto: 998,
} as const;

export const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

export const EJEMPLO_CSV_CORREO = 'email,nombre,referencia,numero_factura\nana@correo.com,Ana Pérez,CLI-001,FE-1001\nluis@correo.com,Luis Gómez,CLI-002,FE-1002\n';

export interface LecturaDirecciones {
  direcciones: IDireccionEmail[];
  invalidas: string[];
}

/** "Ana <ana@x.com>, luis@x.com; ..." → direcciones (sin duplicados) + entradas inválidas. */
export function leerDirecciones(texto: string): LecturaDirecciones {
  const direcciones: IDireccionEmail[] = [];
  const invalidas: string[] = [];
  const vistos = new Set<string>();
  for (const parte of texto.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean)) {
    const m = parte.match(/^(.*)<\s*([^>]+)\s*>$/);
    const email = (m ? (m[2] ?? '') : parte).trim();
    const nombre = m ? (m[1] ?? '').trim().replace(/^"|"$/g, '') || undefined : undefined;
    if (!EMAIL.test(email)) {
      invalidas.push(parte);
      continue;
    }
    const clave = email.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    direcciones.push(nombre ? { email, nombre } : { email });
  }
  return { direcciones, invalidas };
}

export const PRIORIDADES = [
  { value: '1', label: '1 — Máxima' },
  { value: '3', label: '3 — Alta' },
  { value: '5', label: '5 — Normal' },
  { value: '7', label: '7 — Baja' },
  { value: '9', label: '9 — Mínima' },
];
