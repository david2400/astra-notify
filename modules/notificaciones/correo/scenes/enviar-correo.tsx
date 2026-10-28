/** @format */

'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { HiOutlineEye, HiOutlinePaperAirplane } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Label } from '@repo/ui/label/scenes/label';
import {
  enviarEmailLoteServerAction,
  enviarEmailServerAction,
  obtenerPlantillaCorreoServerAction,
  previsualizarPlantillaCorreoServerAction,
} from '@/app/[locale]/(protected)/notificaciones/correo/actions';
import { NativeSelect } from '@/modules/administre/email/shared';
import {
  AvisoError,
  Bloque,
  CamposVariables,
  CargaDestinatarios,
  leerBase64,
  localAIso,
  nuevaClave,
  OpcionRadio,
  SelectorModo,
  soloConValor,
  variablesFaltantes,
  type LecturaDestinatarios,
  type ModoEnvio,
  type VariableCampo,
} from '../../shared';
import { Adjuntos } from '../components/adjuntos';
import { ResultadoCorreo } from '../components/resultado-correo';
import { ResultadoLoteCorreo } from '../components/resultado-lote-correo';
import { VistaHtml } from '../components/vista-html';
import {
  EJEMPLO_CSV_CORREO,
  EMAIL,
  leerDirecciones,
  LIMITES_CORREO,
  PRIORIDADES,
  type IAdjuntoEmail,
  type IEmailLoteResultado,
  type IEmailResultado,
  type IEnviarEmail,
  type IEnviarEmailLote,
  type OpcionCuentaCorreo,
  type OpcionPlantillaCorreo,
  type OpcionProveedorCorreo,
  type OpcionTipoCorreo,
} from '../models/correo.interface';

interface Props {
  tipos: OpcionTipoCorreo[];
  plantillas: OpcionPlantillaCorreo[];
  proveedores: OpcionProveedorCorreo[];
  cuentas: OpcionCuentaCorreo[];
  errorCatalogos?: string;
}

type Contenido = 'directo' | 'plantilla';
type Vista = { asunto?: string; html?: string; texto?: string; errores?: string[] };

const COLUMNAS_EMAIL = ['email', 'correo', 'e-mail', 'mail', 'para', 'destinatario'];
const LECTURA_VACIA: LecturaDestinatarios = { filas: [], columnasVariables: [], conEncabezado: false };
const HTML_INICIAL = '<p>Hola,</p>\n<p>Escribe aquí el contenido del correo.</p>';
const esEmail = (v: string) => EMAIL.test(v);
const minuscula = (v: string) => v.trim().toLowerCase();

/** datetime-local mínimo (ahora + 1 min) en hora local. */
const ahoraLocal = () => {
  const d = new Date(Date.now() + 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/**
 * Envío de correo por email_gateway: individual (POST /v1/email/send) con para/cc/cco o masivo (POST /v1/email/lotes)
 * desde una lista o CSV con variables por fila; contenido directo (HTML) o plantilla, adjuntos en Base64 y envío programado.
 */
export function EnviarCorreoScene({ tipos, plantillas, proveedores, cuentas, errorCatalogos }: Props) {
  const [modo, setModo] = useState<ModoEnvio>('individual');
  const [contenido, setContenido] = useState<Contenido>(plantillas.length ? 'plantilla' : 'directo');
  const [tipo, setTipo] = useState('');
  const [plantillaCodigo, setPlantillaCodigo] = useState('');
  const [variablesPlantilla, setVariablesPlantilla] = useState<VariableCampo[]>([]);
  const [cargandoPlantilla, setCargandoPlantilla] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [asunto, setAsunto] = useState('');
  const [html, setHtml] = useState(HTML_INICIAL);
  const [texto, setTexto] = useState('');
  const [verHtml, setVerHtml] = useState(false);
  const [para, setPara] = useState('');
  const [cc, setCc] = useState('');
  const [cco, setCco] = useState('');
  const [responderA, setResponderA] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [programar, setProgramar] = useState(false);
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [etiquetas, setEtiquetas] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [esperar, setEsperar] = useState(false);
  const [rechazarSiErrores, setRechazarSiErrores] = useState(true);
  const [lectura, setLectura] = useState<LecturaDestinatarios>(LECTURA_VACIA);
  const [clave, setClave] = useState(nuevaClave);
  const [vista, setVista] = useState<Vista | null>(null);
  const [previsualizando, setPrevisualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ individual?: IEmailResultado; lote?: IEmailLoteResultado; destino: string; lineas: number[] } | null>(null);
  const [reinicio, setReinicio] = useState(0);

  const plantilla = plantillas.find((p) => p.codigo === plantillaCodigo);
  const validas = lectura.filas.filter((f) => !f.error);
  const cuentasProveedor = cuentas.filter((c) => !proveedor || c.proveedor === proveedor);

  const cambiarPlantilla = async (codigo: string) => {
    setPlantillaCodigo(codigo);
    setVariables({});
    setVariablesPlantilla([]);
    setVista(null);
    const p = plantillas.find((x) => x.codigo === codigo);
    if (p?.tipo_mensaje && tipos.some((t) => t.codigo === p.tipo_mensaje)) setTipo(p.tipo_mensaje);
    if (!codigo) return;
    setCargandoPlantilla(true);
    const r = await obtenerPlantillaCorreoServerAction(codigo);
    setCargandoPlantilla(false);
    if (r.success) setVariablesPlantilla(r.data.variables ?? []);
    else setError(`No se pudieron leer las variables de la plantilla: ${r.error}`);
  };

  /** Variables de una fila del CSV: comunes + columnas con el nombre de una variable de la plantilla. */
  const variablesFila = (fila?: { variables: Record<string, string>; nombre?: string }) => {
    const vars = soloConValor(variables);
    if (!fila) return vars;
    for (const v of variablesPlantilla) {
      const valor = fila.variables[minuscula(v.nombre)];
      if (valor) vars[v.nombre] = valor;
    }
    return vars;
  };

  const previsualizar = async () => {
    setError(null);
    if (!plantilla) return setError('Selecciona una plantilla.');
    setPrevisualizando(true);
    const r = await previsualizarPlantillaCorreoServerAction({ codigo: plantilla.codigo, variables: variablesFila(modo === 'masivo' ? validas[0] : undefined) });
    setPrevisualizando(false);
    if (!r.success) return setError(r.error);
    setVista({
      asunto: r.data.asunto,
      html: r.data.html,
      texto: r.data.texto,
      errores: r.data.valido ? undefined : (r.data.errores ?? []).map((e) => `${e.variable ? `${e.variable}: ` : ''}${e.mensaje}`),
    });
  };

  const reiniciar = (conservarContenido = false) => {
    setResultado(null);
    setClave(nuevaClave());
    if (conservarContenido) return;
    setPara('');
    setCc('');
    setCco('');
    setArchivos([]);
    setLectura(LECTURA_VACIA);
    setReinicio((n) => n + 1);
    setVista(null);
    // Evita programar sin querer el siguiente envío con una fecha que ya pasó
    setProgramar(false);
    setFechaProgramada('');
  };

  const validarComun = (): string | null => {
    if (!tipo && !(contenido === 'plantilla' && plantilla?.tipo_mensaje)) return 'Selecciona el tipo de mensaje.';
    if (contenido === 'plantilla' && !plantilla) return 'Selecciona una plantilla.';
    if (contenido === 'plantilla' && cargandoPlantilla) return 'Espera a que carguen las variables de la plantilla.';
    if (contenido === 'directo') {
      if (!asunto.trim()) return 'Escribe el asunto.';
      if (asunto.length > LIMITES_CORREO.asunto) return `El asunto supera ${LIMITES_CORREO.asunto} caracteres.`;
      if (!html.trim() && !texto.trim()) return 'Escribe el contenido HTML o el texto.';
    }
    if (responderA.trim() && !esEmail(responderA.trim())) return 'El correo de "Responder a" no es válido.';
    if (programar) {
      if (!fechaProgramada) return 'Elige la fecha y hora del envío programado.';
      if (new Date(fechaProgramada).getTime() <= Date.now()) return 'La fecha programada debe ser futura.';
    }
    if (etiquetas.split(',').some((e) => e.trim().length > 50)) return 'Cada etiqueta admite máximo 50 caracteres.';
    return null;
  };

  /** Campos comunes a individual y lote. */
  const comunes = async () => {
    const adjuntos: IAdjuntoEmail[] = await Promise.all(
      archivos.map(async (f) => ({ nombre: f.name, content_type: f.type || 'application/octet-stream', contenido_base64: await leerBase64(f) })),
    );
    const listaEtiquetas = etiquetas.split(',').map((e) => e.trim()).filter(Boolean);
    return {
      tipo_mensaje: tipo || undefined,
      proveedor_preferido: proveedor || undefined,
      cuenta: cuenta || undefined,
      responder_a: responderA.trim() ? { email: responderA.trim() } : undefined,
      adjuntos: adjuntos.length ? adjuntos : undefined,
      etiquetas: listaEtiquetas.length ? listaEtiquetas : undefined,
      prioridad: prioridad ? Number(prioridad) : undefined,
      programado_para: programar ? localAIso(fechaProgramada) : undefined,
      idempotency_key: clave,
      ...(contenido === 'plantilla'
        ? { plantilla: plantillaCodigo }
        : { asunto: asunto.trim(), html: html.trim() || undefined, texto: texto.trim() || undefined }),
    };
  };

  const enviarIndividual = async () => {
    const lp = leerDirecciones(para);
    const lc = leerDirecciones(cc);
    const lo = leerDirecciones(cco);
    const invalidas = [...lp.invalidas, ...lc.invalidas, ...lo.invalidas];
    if (invalidas.length) return setError(`Direcciones inválidas: ${invalidas.join(', ')}`);
    if (!lp.direcciones.length) return setError('Escribe al menos un destinatario en "Para".');
    const total = lp.direcciones.length + lc.direcciones.length + lo.direcciones.length;
    if (total > LIMITES_CORREO.destinatariosPorCorreo) return setError(`Máximo ${LIMITES_CORREO.destinatariosPorCorreo} destinatarios por correo (para + cc + cco). Usa el envío masivo.`);
    if (contenido === 'plantilla') {
      const faltan = variablesFaltantes(variablesPlantilla, variables);
      if (faltan.length) return setError(`Faltan variables obligatorias: ${faltan.join(', ')}`);
    }
    setEnviando(true);
    try {
      const payload: IEnviarEmail = {
        ...(await comunes()),
        para: lp.direcciones,
        cc: lc.direcciones.length ? lc.direcciones : undefined,
        cco: lo.direcciones.length ? lo.direcciones : undefined,
        variables: contenido === 'plantilla' ? soloConValor(variables) : undefined,
        modo: esperar && !programar ? 'SINCRONO' : 'ASINCRONO',
      };
      const r = await enviarEmailServerAction(payload);
      if (!r.success) return setError(r.error);
      setResultado({ individual: r.data, destino: lp.direcciones.map((d) => d.email).join(', '), lineas: [] });
    } finally {
      setEnviando(false);
    }
  };

  const enviarMasivo = async () => {
    if (!validas.length) return setError('Agrega al menos un destinatario válido.');
    if (validas.length > LIMITES_CORREO.lote) return setError(`Máximo ${LIMITES_CORREO.lote} destinatarios por lote.`);
    if (contenido === 'plantilla') {
      const faltan = variablesFaltantes(variablesPlantilla, variables).filter((v) => !lectura.columnasVariables.includes(minuscula(v)));
      if (faltan.length) return setError(`Faltan variables obligatorias (comunes o columna del CSV): ${faltan.join(', ')}`);
    }
    const confirmacion = await Swal.fire({
      title: `¿Enviar ${validas.length} correos?`,
      html: `${programar ? `Se programarán para <b>${new Date(fechaProgramada).toLocaleString('es-CO')}</b>.` : 'Se encolarán para envío inmediato.'}${archivos.length ? `<br/>Con ${archivos.length} adjunto(s) para todos.` : ''}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmacion.isConfirmed) return;
    setEnviando(true);
    try {
      const payload: IEnviarEmailLote = {
        ...(await comunes()),
        rechazar_si_hay_errores: rechazarSiErrores,
        destinatarios: validas.map((f) => {
          const vars = contenido === 'plantilla' ? variablesFila(f) : {};
          return {
            email: f.destino,
            nombre: f.nombre || undefined,
            referencia: f.referencia || undefined,
            variables: Object.keys(vars).length ? vars : undefined,
          };
        }),
      };
      const r = await enviarEmailLoteServerAction(payload);
      if (!r.success) return setError(r.error);
      setResultado({ lote: r.data, destino: '', lineas: validas.map((f) => f.linea) });
    } finally {
      setEnviando(false);
    }
  };

  const enviar = async () => {
    setError(null);
    const e = validarComun();
    if (e) return setError(e);
    try {
      if (modo === 'individual') await enviarIndividual();
      else await enviarMasivo();
    } catch (err) {
      setError((err as Error)?.message || 'No se pudo enviar.');
    }
  };

  if (resultado?.individual) return <ResultadoCorreo resultado={resultado.individual} destino={resultado.destino} onNuevo={() => reiniciar()} />;
  if (resultado?.lote)
    return <ResultadoLoteCorreo resultado={resultado.lote} lineas={resultado.lineas} onNuevo={() => reiniciar()} onCorregir={() => reiniciar(true)} />;

  return (
    <div className='flex flex-col gap-5'>
      {errorCatalogos ? (
        <p role='alert' className='rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm'>
          No se pudieron cargar todos los catálogos de email_gateway ({errorCatalogos}). Puedes enviar con lo disponible.
        </p>
      ) : null}

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SelectorModo modo={modo} onChange={(m) => { setModo(m); setError(null); setVista(null); }} />
        <p className='text-sm text-muted-foreground'>
          {modo === 'individual' ? `Hasta ${LIMITES_CORREO.destinatariosPorCorreo} direcciones en un mismo correo.` : `Un correo por destinatario, hasta ${LIMITES_CORREO.lote} por lote.`}
        </p>
      </div>

      <Bloque titulo='Destinatarios'>
        {modo === 'individual' ? (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-1.5 md:col-span-2'>
              <Label htmlFor='correo-para'>Para</Label>
              <Input id='correo-para' placeholder='ana@correo.com, Luis Gómez <luis@correo.com>' value={para} onChange={(e) => setPara(e.target.value)} />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='correo-cc'>CC</Label>
              <Input id='correo-cc' placeholder='Opcional' value={cc} onChange={(e) => setCc(e.target.value)} />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='correo-cco'>CCO</Label>
              <Input id='correo-cco' placeholder='Opcional' value={cco} onChange={(e) => setCco(e.target.value)} />
            </div>
          </div>
        ) : (
          <>
            <CargaDestinatarios
              key={reinicio}
              destinoColumnas={COLUMNAS_EMAIL}
              esDestinoValido={esEmail}
              normalizarDestino={(v) => v.trim()}
              variablesPlantilla={contenido === 'plantilla' ? variablesPlantilla.map((v) => v.nombre) : []}
              ejemploCsv={EJEMPLO_CSV_CORREO}
              nombreEjemplo='destinatarios-correo.csv'
              maximo={LIMITES_CORREO.lote}
              placeholder={'Un correo por línea, o CSV con encabezado:\nemail,nombre,referencia,numero_factura\nana@correo.com,Ana Pérez,CLI-001,FE-1001'}
              onChange={setLectura}
            />
            <label className='flex items-center gap-2 text-sm'>
              <input type='checkbox' checked={rechazarSiErrores} onChange={(e) => setRechazarSiErrores(e.target.checked)} className='accent-primary' />
              Si algún destinatario tiene errores (ej. variables), no enviar ninguno
            </label>
          </>
        )}
        <div className='space-y-1.5 md:max-w-md'>
          <Label htmlFor='correo-responder'>Responder a</Label>
          <Input id='correo-responder' type='email' placeholder='Opcional (por defecto, el remitente de la cuenta)' value={responderA} onChange={(e) => setResponderA(e.target.value)} />
        </div>
      </Bloque>

      <Bloque titulo='Contenido' descripcion='Asunto y HTML directos, o una plantilla registrada en Administración Email.'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <NativeSelect
            id='correo-tipo'
            label='Tipo de mensaje'
            placeholder={tipos.length ? 'Selecciona...' : 'Sin tipos disponibles'}
            opciones={tipos.map((t) => ({ value: t.codigo, label: t.descripcion ? `${t.codigo} — ${t.descripcion}` : t.codigo }))}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
          <div className='space-y-1.5'>
            <span className='text-sm font-medium text-foreground'>Contenido</span>
            <div className='flex gap-2'>
              <OpcionRadio nombre='correo-contenido' valor='directo' actual={contenido} onChange={(v) => { setContenido(v as Contenido); setVista(null); }}>Directo</OpcionRadio>
              <OpcionRadio nombre='correo-contenido' valor='plantilla' actual={contenido} onChange={(v) => { setContenido(v as Contenido); setVista(null); }}>Plantilla</OpcionRadio>
            </div>
          </div>
        </div>

        {contenido === 'directo' ? (
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='correo-asunto'>Asunto</Label>
              <Input id='correo-asunto' maxLength={LIMITES_CORREO.asunto} value={asunto} onChange={(e) => setAsunto(e.target.value.replace(/[\r\n]/g, ' '))} />
            </div>
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='correo-html'>Cuerpo HTML</Label>
                <Buttons type='button' size='sm' variant='ghost' onClick={() => setVerHtml((v) => !v)}>
                  <HiOutlineEye className='h-4 w-4' /> {verHtml ? 'Ocultar vista previa' : 'Vista previa'}
                </Buttons>
              </div>
              <textarea
                id='correo-html'
                rows={8}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className='w-full resize-y rounded-xl border border-input bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'
              />
              {verHtml ? <VistaHtml html={html} asunto={asunto} /> : null}
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='correo-texto'>Texto alternativo</Label>
              <textarea
                id='correo-texto'
                rows={3}
                value={texto}
                placeholder='Opcional: versión en texto plano para clientes sin HTML'
                onChange={(e) => setTexto(e.target.value)}
                className='w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
              />
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <NativeSelect
              id='correo-plantilla'
              label='Plantilla'
              placeholder={plantillas.length ? 'Selecciona...' : 'Sin plantillas disponibles'}
              opciones={plantillas.map((p) => ({ value: p.codigo, label: `${p.codigo} — ${p.nombre}` }))}
              value={plantillaCodigo}
              onChange={(e) => void cambiarPlantilla(e.target.value)}
            />
            {plantilla ? (
              <>
                <p className='text-sm text-muted-foreground'>Asunto: <span className='text-foreground'>{plantilla.asunto}</span></p>
                {cargandoPlantilla ? (
                  <p className='text-sm text-muted-foreground'>Cargando variables...</p>
                ) : (
                  <>
                    <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                      {modo === 'masivo' ? 'Variables comunes (las columnas del CSV con el mismo nombre las reemplazan por fila)' : 'Variables'}
                    </p>
                    <CamposVariables variables={variablesPlantilla} valores={variables} onChange={setVariables} comunes={modo === 'masivo'} prefijoId='correo-var' />
                  </>
                )}
                <Buttons type='button' size='sm' variant='outline' loading={previsualizando} onClick={previsualizar}>
                  <HiOutlineEye className='h-4 w-4' /> Vista previa{modo === 'masivo' && validas.length ? ' (primer destinatario)' : ''}
                </Buttons>
                {vista?.errores?.length ? (
                  <p className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs'>{vista.errores.join(' · ')}</p>
                ) : null}
                {vista?.html || vista?.asunto ? <VistaHtml html={vista.html ?? `<pre>${vista.texto ?? ''}</pre>`} asunto={vista.asunto} /> : null}
              </>
            ) : null}
          </div>
        )}
      </Bloque>

      <Bloque titulo='Adjuntos' descripcion={modo === 'masivo' ? 'Se envían a todos los destinatarios del lote (el gateway los guarda una sola vez).' : undefined}>
        <Adjuntos archivos={archivos} onChange={setArchivos} onError={(m) => void Swal.fire({ title: 'Adjunto no válido', text: m, icon: 'warning' })} />
      </Bloque>

      <Bloque titulo='Programación y opciones'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-sm font-medium'>
              <input
                type='checkbox'
                checked={programar}
                onChange={(e) => {
                  setProgramar(e.target.checked);
                  if (e.target.checked && !fechaProgramada) setFechaProgramada(ahoraLocal());
                }}
                className='accent-primary'
              />
              Programar envío
            </label>
            {programar ? (
              <Input id='correo-programado' aria-label='Fecha y hora programada' type='datetime-local' min={ahoraLocal()} value={fechaProgramada} onChange={(e) => setFechaProgramada(e.target.value)} />
            ) : (
              <p className='text-xs text-muted-foreground'>Sin programar se envía de inmediato.</p>
            )}
          </div>
          <NativeSelect id='correo-prioridad' label='Prioridad en la cola' placeholder='La del tipo de mensaje' opciones={PRIORIDADES} value={prioridad} onChange={(e) => setPrioridad(e.target.value)} />
          <div className='space-y-1.5'>
            <Label htmlFor='correo-etiquetas'>Etiquetas</Label>
            <Input id='correo-etiquetas' placeholder='facturacion, octubre' value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} />
          </div>
        </div>
        {modo === 'individual' ? (
          <label className={`flex items-center gap-2 text-sm ${programar ? 'opacity-50' : ''}`}>
            <input type='checkbox' disabled={programar} checked={esperar && !programar} onChange={(e) => setEsperar(e.target.checked)} className='accent-primary' />
            Esperar el resultado del proveedor (modo síncrono)
          </label>
        ) : null}
        <details>
          <summary className='cursor-pointer text-sm font-medium text-foreground'>Proveedor y cuenta</summary>
          <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-2'>
            <NativeSelect
              id='correo-proveedor'
              label='Proveedor preferido'
              placeholder='Según la ruta'
              opciones={proveedores.map((p) => ({ value: p.codigo, label: p.nombre }))}
              value={proveedor}
              onChange={(e) => { setProveedor(e.target.value); setCuenta(''); }}
            />
            <NativeSelect
              id='correo-cuenta'
              label='Cuenta'
              placeholder='Según la ruta'
              opciones={cuentasProveedor.map((c) => ({ value: c.codigo, label: `${c.codigo} (${c.remitente})` }))}
              value={cuenta}
              onChange={(e) => setCuenta(e.target.value)}
            />
          </div>
        </details>
      </Bloque>

      <AvisoError mensaje={error} />

      <div className='flex justify-end'>
        <Buttons type='button' className='inline-flex items-center gap-2' loading={enviando} disabled={enviando} onClick={enviar}>
          <HiOutlinePaperAirplane className='h-4 w-4' />
          {modo === 'individual' ? (programar ? 'Programar correo' : 'Enviar correo') : `${programar ? 'Programar' : 'Enviar'} ${validas.length ? `${validas.length} ` : ''}correos`}
        </Buttons>
      </div>
    </div>
  );
}
