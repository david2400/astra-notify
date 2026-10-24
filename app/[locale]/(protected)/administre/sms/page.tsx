/** @format */

import type { Metadata } from 'next';
import { getProveedores } from '@/server/domains/administre/sms/proveedores';
import { getCuentas } from '@/server/domains/administre/sms/cuentas';
import { getTiposMensaje } from '@/server/domains/administre/sms/tipos-mensaje';
import { getRutas } from '@/server/domains/administre/sms/rutas';
import { getPlantillas } from '@/server/domains/administre/sms/plantillas';
import { ResumenScene, type ResumenSms } from '@/modules/administre/sms/resumen';

export const metadata: Metadata = { title: 'Configuración SMS' };

/** Resumen: cada fuente puede fallar por separado (la tarjeta muestra '—'). */
export default async function AdministreSmsPage() {
  const [proveedores, cuentas, tipos, rutas, plantillas] = await Promise.allSettled([
    getProveedores(),
    getCuentas(),
    getTiposMensaje(),
    getRutas(),
    getPlantillas(),
  ]);
  const valor = <T,>(r: PromiseSettledResult<T[]>) => (r.status === 'fulfilled' ? r.value : null);

  const alertas: string[] = [];
  const lista = [proveedores, cuentas, tipos, rutas, plantillas];
  if (lista.some((r) => r.status === 'rejected')) {
    alertas.push('No se pudo leer parte de la configuración: verifica que sms_gateway esté disponible.');
  }
  for (const p of valor(proveedores) ?? []) {
    if (!p.eliminado && !p.implementado) alertas.push(`El proveedor ${p.codigo} no tiene módulo implementado en el gateway.`);
  }
  for (const c of valor(cuentas) ?? []) {
    const sinClave = !c.clave_configurada && !(c.secret_ref && c.secret_definido);
    if (!c.eliminado && c.rutas.length && sinClave) alertas.push(`La cuenta ${c.codigo} se usa en rutas pero no tiene credenciales.`);
  }
  for (const r of valor(rutas) ?? []) {
    if (!r.eliminado && r.pasos.length === 0) alertas.push(`La ruta ${r.proveedor_codigo} / ${r.tipo_mensaje} no tiene pasos.`);
  }

  const data: ResumenSms = {
    proveedores: valor(proveedores)?.length ?? null,
    cuentas: valor(cuentas)?.length ?? null,
    tiposMensaje: valor(tipos)?.length ?? null,
    rutas: valor(rutas)?.length ?? null,
    plantillas: valor(plantillas)?.length ?? null,
    alertas,
  };
  return <ResumenScene data={data} />;
}
