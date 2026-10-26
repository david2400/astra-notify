/** @format */

'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Label } from '@repo/ui/label/scenes/label';
import { enviarPruebaEmailServerAction } from '@/app/[locale]/(protected)/administre/email/envios/actions';
import { NativeSelect, type OpcionSelect } from '../../shared/components/native-select';
import { PROVEEDORES_ENVIO, type IEnvioPrueba } from '../models/envio.interface';

interface Props {
  tipos: OpcionSelect[];
  plantillas: OpcionSelect[];
  onEnviado: (envioId: string) => void;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Envío de prueba en modo SINCRONO (espera el resultado): con plantilla + variables (JSON) o contenido directo.
 * Útil para validar credenciales, rutas y plantillas de punta a punta.
 */
export function FormEnvioPrueba({ tipos, plantillas, onEnviado }: Props) {
  const router = useRouter();
  const [v, setV] = useState({ para: '', tipo: '', plantilla: '', variables: '{}', asunto: 'Prueba de email_gateway', html: '<p>Hola, este es un correo de prueba.</p>', preferido: '' });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));

  const enviar = async () => {
    setError(null);
    if (!EMAIL.test(v.para.trim())) return setError('Escribe un email de destino válido.');
    let variables: Record<string, string> | undefined;
    if (v.plantilla) {
      try {
        variables = v.variables.trim() ? JSON.parse(v.variables) : {};
      } catch {
        return setError('Las variables deben ser un objeto JSON, ej. {"nombre":"Ana"}');
      }
    } else if (!v.tipo) {
      return setError('Selecciona el tipo de mensaje (o una plantilla con tipo por defecto).');
    }
    const payload: IEnvioPrueba = {
      para: [{ email: v.para.trim() }],
      tipo_mensaje: v.tipo || undefined,
      proveedor_preferido: v.preferido || undefined,
      modo: 'SINCRONO',
      ...(v.plantilla ? { plantilla: v.plantilla, variables } : { asunto: v.asunto, html: v.html }),
    };
    setEnviando(true);
    const r = await enviarPruebaEmailServerAction(payload);
    setEnviando(false);
    if (!r.success) return setError(r.error);
    const d = r.data;
    await Swal.fire({
      title: d.estado === 'ENVIADO' ? 'Email enviado' : d.estado === 'FALLIDO' ? 'El envío falló' : `Estado: ${d.estado}`,
      text: d.estado === 'ENVIADO'
        ? `Por ${d.proveedor}/${d.cuenta} en ${d.total_intentos} intento(s).`
        : d.detalle_error ?? 'El envío sigue en la cola; revisa el detalle.',
      icon: d.estado === 'ENVIADO' ? 'success' : d.estado === 'FALLIDO' ? 'error' : 'info',
    });
    router.refresh();
    onEnviado(d.envio_id);
  };

  return (
    <div className='grid grid-cols-12 gap-4'>
      <div className='col-span-12 space-y-1.5 md:col-span-6'>
        <Label htmlFor='p-para'>Para</Label>
        <Input id='p-para' type='email' placeholder='tu-correo@dominio.com' value={v.para} onChange={set('para')} />
      </div>
      <NativeSelect id='p-tipo' label='Tipo de mensaje' placeholder='El de la plantilla' opciones={tipos} value={v.tipo} onChange={set('tipo')} className='col-span-6 md:col-span-3' />
      <NativeSelect id='p-preferido' label='Proveedor preferido' placeholder='Según la ruta' opciones={PROVEEDORES_ENVIO} value={v.preferido} onChange={set('preferido')} className='col-span-6 md:col-span-3' />
      <NativeSelect id='p-plantilla' label='Plantilla' placeholder='Sin plantilla (contenido directo)' opciones={plantillas} value={v.plantilla} onChange={set('plantilla')} className='col-span-12' />
      {v.plantilla ? (
        <div className='col-span-12 space-y-1.5'>
          <Label htmlFor='p-variables'>Variables (JSON)</Label>
          <textarea id='p-variables' rows={4} className='w-full rounded-md border border-input bg-background p-3 font-mono text-xs' value={v.variables} onChange={set('variables')} />
        </div>
      ) : (
        <>
          <div className='col-span-12 space-y-1.5'>
            <Label htmlFor='p-asunto'>Asunto</Label>
            <Input id='p-asunto' value={v.asunto} onChange={set('asunto')} />
          </div>
          <div className='col-span-12 space-y-1.5'>
            <Label htmlFor='p-html'>HTML</Label>
            <textarea id='p-html' rows={4} className='w-full rounded-md border border-input bg-background p-3 font-mono text-xs' value={v.html} onChange={set('html')} />
          </div>
        </>
      )}
      {error ? <p className='col-span-12 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{error}</p> : null}
      <Buttons className='col-span-12' loading={enviando} onClick={enviar}>
        Enviar prueba (espera el resultado)
      </Buttons>
    </div>
  );
}
