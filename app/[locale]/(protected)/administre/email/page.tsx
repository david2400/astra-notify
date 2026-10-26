/** @format */

import type { Metadata } from 'next';
import { getProveedoresEmail } from '@/server/domains/administre/email/proveedores';
import { getCuentasEmail } from '@/server/domains/administre/email/cuentas';
import { getTiposMensajeEmail } from '@/server/domains/administre/email/tipos-mensaje';
import { getRutasEmail } from '@/server/domains/administre/email/rutas';
import { getPlantillasEmail } from '@/server/domains/administre/email/plantillas';
import { buscarEnviosEmail } from '@/server/domains/administre/email/envios';
import { ResumenEmailScene, type ResumenEmail } from '@/modules/administre/email/resumen';

export const metadata: Metadata = { title: 'Configuración Email' };

/** Resumen: cada fuente puede fallar por separado (la tarjeta muestra '—'). */
export default async function AdministreEmailPage() {
  const [proveedores, cuentas, tipos, rutas, plantillas, fallidos, pendientes, reintento] = await Promise.allSettled([
    getProveedoresEmail(),
    getCuentasEmail(),
    getTiposMensajeEmail(),
    getRutasEmail(),
    getPlantillasEmail(),
    buscarEnviosEmail({ estado: 'FALLIDO', size: 1 }),
    buscarEnviosEmail({ estado: 'PENDIENTE', size: 1 }),
    buscarEnviosEmail({ estado: 'REINTENTO', size: 1 }),
  ]);
  const valor = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : null);
  const total = (r: PromiseSettledResult<{ total_elements: number }>) => valor(r)?.total_elements ?? null;

  const alertas: string[] = [];
  if ([proveedores, cuentas, tipos, rutas, plantillas].some((r) => r.status === 'rejected')) {
    alertas.push('No se pudo leer parte de la configuración: verifica que email_gateway esté disponible.');
  }
  const listaCuentas = valor(cuentas) ?? [];
  const enRutas = new Set((valor(rutas) ?? []).filter((r) => !r.eliminado).flatMap((r) => r.pasos.map((p) => p.cuenta)));
  for (const p of valor(proveedores) ?? []) {
    if (!p.eliminado && !p.implementado) alertas.push(`El proveedor ${p.codigo} no tiene implementación en el gateway.`);
  }
  for (const c of listaCuentas) {
    if (!c.eliminado && enRutas.has(c.codigo) && !c.credencial_disponible && c.proveedor !== 'MOCK') {
      alertas.push(`La cuenta ${c.codigo} se usa en rutas pero no tiene credenciales disponibles.`);
    }
    if (!c.eliminado && /CAMBIAR/i.test(c.remitente_email)) {
      alertas.push(`La cuenta ${c.codigo} tiene un remitente de ejemplo (${c.remitente_email}).`);
    }
  }
  for (const r of valor(rutas) ?? []) {
    if (!r.eliminado && r.pasos.length === 0) alertas.push(`La ruta ${r.proveedor ?? 'CENTRAL'} / ${r.tipo_mensaje} no tiene pasos.`);
  }

  const data: ResumenEmail = {
    proveedores: valor(proveedores)?.length ?? null,
    cuentas: valor(cuentas)?.length ?? null,
    tiposMensaje: valor(tipos)?.length ?? null,
    rutas: valor(rutas)?.length ?? null,
    plantillas: valor(plantillas)?.length ?? null,
    cola: { fallidos: total(fallidos), pendientes: total(pendientes), reintento: total(reintento) },
    alertas,
  };
  return <ResumenEmailScene data={data} />;
}
