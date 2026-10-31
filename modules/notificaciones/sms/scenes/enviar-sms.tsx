/** @format */

'use client';

import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import { Buttons } from '@repo/ui/buttons/scenes';
import { Input } from '@repo/ui/inputs/scenes/input';
import { Label } from '@repo/ui/label/scenes/label';
import { enviarSmsLoteServerAction, enviarSmsServerAction } from '@/app/[locale]/(protected)/notificaciones/sms/actions';
import { NativeSelect } from '@/modules/administre/email/shared';
import {
  aplicarVariables,
  AvisoError,
  Bloque,
  calcularSegmentos,
  CamposVariables,
  CargaDestinatarios,
  normalizarTelefono,
  nuevaClave,
  OpcionRadio,
  SelectorModo,
  soloConValor,
  TELEFONO,
  variablesFaltantes,
  type LecturaDestinatarios,
  type ModoEnvio,
} from '../../shared';
import { ResultadoLoteSms } from '../components/resultado-lote-sms';
import { ResultadoSms } from '../components/resultado-sms';
import {
  EJEMPLO_CSV_SMS,
  MAX_DESTINOS_SMS,
  type IEnviarSms,
  type IEnviarSmsLote,
  type ISmsLoteResultado,
  type ISmsResultado,
  type OpcionCuenta,
  type OpcionPlantillaSms,
  type OpcionProveedor,
  type OpcionRutaSms,
  type OpcionTipoSms,
} from '../models/sms.interface';

interface Props {
  tipos: OpcionTipoSms[];
  plantillas: OpcionPlantillaSms[];
  proveedores: OpcionProveedor[];
  cuentas: OpcionCuenta[];
  rutas?: OpcionRutaSms[];
  errorCatalogos?: string;
}

type Contenido = 'texto' | 'plantilla';

const COLUMNAS_TELEFONO = ['telefono', 'teléfono', 'celular', 'movil', 'móvil', 'numero', 'número', 'to', 'phone'];
const LECTURA_VACIA: LecturaDestinatarios = { filas: [], columnasVariables: [], conEncabezado: false };

/**
 * Envío de SMS por la cola de notificacion: individual (POST /v1/envios/sms con idempotency_key; se espera el
 * resultado unos segundos) o masivo (POST /v1/envios/sms/lote) con texto libre o plantilla y variables por
 * destinatario. El individual puede pedir una ruta (código o id) en lugar de proveedor/cuenta.
 */
export function EnviarSmsScene({ tipos, plantillas, proveedores, cuentas, rutas = [], errorCatalogos }: Props) {
  const [modo, setModo] = useState<ModoEnvio>('individual');
  const [contenido, setContenido] = useState<Contenido>(plantillas.length ? 'plantilla' : 'texto');
  const [tipo, setTipo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [plantillaCodigo, setPlantillaCodigo] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [telefono, setTelefono] = useState('');
  const [indicativo, setIndicativo] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [sender, setSender] = useState('');
  const [ruta, setRuta] = useState('');
  const [lectura, setLectura] = useState<LecturaDestinatarios>(LECTURA_VACIA);
  const [clave, setClave] = useState(nuevaClave);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ individual?: ISmsResultado; lote?: ISmsLoteResultado; destino: string; destinos: string[] } | null>(null);
  const [reinicio, setReinicio] = useState(0);

  const plantilla = plantillas.find((p) => p.codigo === plantillaCodigo);
  const defectos = useMemo(
    () => Object.fromEntries((plantilla?.variables ?? []).filter((v) => v.valor_defecto).map((v) => [v.nombre, String(v.valor_defecto)])),
    [plantilla],
  );
  const vistaPrevia = contenido === 'plantilla' ? (plantilla ? aplicarVariables(plantilla.contenido, variables, defectos) : '') : mensaje;
  const segmentos = calcularSegmentos(vistaPrevia);
  const validas = lectura.filas.filter((f) => !f.error);
  const cuentasProveedor = cuentas.filter((c) => !proveedor || c.proveedor === proveedor);
  // La ruta solo aplica al envío individual y no se combina con proveedor ni cuenta
  const rutaElegida = modo === 'individual' ? rutas.find((r) => r.valor === ruta) : undefined;

  const cambiarPlantilla = (codigo: string) => {
    setPlantillaCodigo(codigo);
    setVariables({});
    const p = plantillas.find((x) => x.codigo === codigo);
    if (p?.tipo_mensaje && tipos.some((t) => t.codigo === p.tipo_mensaje)) setTipo(p.tipo_mensaje);
  };

  const reiniciar = () => {
    setResultado(null);
    setTelefono('');
    setLectura(LECTURA_VACIA);
    setReinicio((n) => n + 1);
    setClave(nuevaClave());
  };

  /** Campos comunes a individual y masivo. */
  const base = (): Pick<IEnviarSms, 'tipo_mensaje' | 'message' | 'plantilla' | 'variables' | 'proveedor' | 'cuenta' | 'sender'> => ({
    tipo_mensaje: tipo || undefined,
    proveedor: rutaElegida ? undefined : proveedor || undefined,
    cuenta: rutaElegida ? undefined : cuenta || undefined,
    sender: sender.trim() || undefined,
    ...(contenido === 'plantilla' ? { plantilla: plantillaCodigo, variables: soloConValor(variables) } : { message: mensaje.trim() }),
  });

  const validarComun = (): string | null => {
    if (!tipo && !rutaElegida && !(contenido === 'plantilla' && plantilla?.tipo_mensaje)) return 'Selecciona el tipo de mensaje (o una ruta).';
    if (contenido === 'texto' && !mensaje.trim()) return 'Escribe el mensaje.';
    if (contenido === 'plantilla' && !plantilla) return 'Selecciona una plantilla.';
    return null;
  };

  const enviarIndividual = async () => {
    const destino = normalizarTelefono(telefono);
    if (!TELEFONO.test(destino)) return setError('Escribe un celular válido (10 a 15 dígitos, + opcional).');
    if (contenido === 'plantilla' && plantilla) {
      const faltan = variablesFaltantes(plantilla.variables, variables);
      if (faltan.length) return setError(`Faltan variables obligatorias: ${faltan.join(', ')}`);
    }
    const payload: IEnviarSms = { ...base(), to: destino, country_code: indicativo.trim() || undefined, ruta: rutaElegida?.valor };
    setEnviando(true);
    const r = await enviarSmsServerAction(payload, clave);
    setEnviando(false);
    if (!r.success) return setError(r.error);
    setResultado({ individual: r.data, destino, destinos: [destino] });
    setClave(nuevaClave());
  };

  const enviarMasivo = async () => {
    if (!validas.length) return setError('Agrega al menos un destinatario válido.');
    if (validas.length > MAX_DESTINOS_SMS) return setError(`Máximo ${MAX_DESTINOS_SMS} destinatarios por envío.`);
    if (contenido === 'plantilla' && plantilla) {
      // Obligatorias: deben venir como común, como columna o tener valor por defecto
      const faltan = variablesFaltantes(plantilla.variables, variables).filter((v) => !lectura.columnasVariables.includes(v.toLowerCase()));
      if (faltan.length) return setError(`Faltan variables obligatorias (comunes o columna del CSV): ${faltan.join(', ')}`);
    }
    const sms = segmentos.partes || 1;
    const confirmacion = await Swal.fire({
      title: `¿Enviar ${validas.length} SMS?`,
      html: `Se enviarán <b>${validas.length}</b> mensajes (~${validas.length * sms} SMS facturables${contenido === 'plantilla' ? ' estimados' : ''}).<br/>Esta acción no se puede deshacer.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmacion.isConfirmed) return;

    const nombresVariables = new Set((plantilla?.variables ?? []).map((v) => v.nombre.toLowerCase()));
    const payload: IEnviarSmsLote = {
      ...base(),
      destinations: validas.map((f) => {
        // Las columnas del CSV se mapean a las variables con el nombre exacto de la plantilla
        const vars: Record<string, string> = {};
        if (contenido === 'plantilla') {
          for (const [k, v] of Object.entries(f.variables)) {
            if (!v) continue;
            const nombre = plantilla?.variables.find((x) => x.nombre.toLowerCase() === k)?.nombre ?? k;
            if (nombresVariables.has(k)) vars[nombre] = v;
          }
        }
        return { to: f.destino, country_code: f.indicativo || indicativo.trim() || undefined, variables: Object.keys(vars).length ? vars : undefined };
      }),
    };
    setEnviando(true);
    const r = await enviarSmsLoteServerAction(payload);
    setEnviando(false);
    if (!r.success) return setError(r.error);
    setResultado({ lote: r.data, destino: '', destinos: validas.map((f) => f.destino) });
  };

  const enviar = async () => {
    setError(null);
    const e = validarComun();
    if (e) return setError(e);
    if (modo === 'individual') await enviarIndividual();
    else await enviarMasivo();
  };

  if (resultado?.individual) return <ResultadoSms resultado={resultado.individual} destino={resultado.destino} onNuevo={reiniciar} />;
  if (resultado?.lote) return <ResultadoLoteSms resultado={resultado.lote} destinos={resultado.destinos} onNuevo={reiniciar} />;

  const rutaSelect = (
    <NativeSelect
      id='sms-ruta'
      label='Ruta'
      placeholder={rutas.length ? 'Automática (según el tipo)' : 'Sin rutas disponibles'}
      opciones={rutas.map((r) => ({ value: r.valor, label: r.etiqueta }))}
      value={ruta}
      disabled={modo !== 'individual'}
      onChange={(e) => {
        setRuta(e.target.value);
        const r = rutas.find((x) => x.valor === e.target.value);
        if (r && !tipo && tipos.some((t) => t.codigo === r.tipo_mensaje)) setTipo(r.tipo_mensaje);
      }}
    />
  );

  return (
    <div className='flex flex-col gap-5'>
      {errorCatalogos ? (
        <p role='alert' className='rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm'>
          No se pudieron cargar todos los catálogos de sms_gateway ({errorCatalogos}). Puedes enviar con lo disponible.
        </p>
      ) : null}

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SelectorModo modo={modo} onChange={(m) => { setModo(m); setError(null); }} />
        <p className='text-sm text-muted-foreground'>
          {modo === 'individual'
            ? 'Un número; sale por la cola de notificacion y el resultado llega en segundos.'
            : `Lista pegada o CSV, hasta ${MAX_DESTINOS_SMS} números (la cola los envía por bloques).`}
        </p>
      </div>

      <Bloque titulo='Mensaje' descripcion='Texto libre o una plantilla registrada en Administración SMS.'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <NativeSelect
            id='sms-tipo'
            label='Tipo de mensaje'
            placeholder={tipos.length ? 'Selecciona...' : 'Sin tipos disponibles'}
            opciones={tipos.map((t) => ({ value: t.codigo, label: t.descripcion ? `${t.codigo} — ${t.descripcion}` : t.codigo }))}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
          <div className='space-y-1.5'>
            <span className='text-sm font-medium text-foreground'>Contenido</span>
            <div className='flex gap-2'>
              <OpcionRadio nombre='sms-contenido' valor='texto' actual={contenido} onChange={(v) => setContenido(v as Contenido)}>Texto libre</OpcionRadio>
              <OpcionRadio nombre='sms-contenido' valor='plantilla' actual={contenido} onChange={(v) => setContenido(v as Contenido)}>Plantilla</OpcionRadio>
            </div>
          </div>
        </div>

        {contenido === 'texto' ? (
          <div className='space-y-1.5'>
            <Label htmlFor='sms-mensaje'>Mensaje</Label>
            <textarea
              id='sms-mensaje'
              rows={4}
              maxLength={1600}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder='Escribe el texto del SMS'
              className='w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
            />
          </div>
        ) : (
          <div className='space-y-4'>
            <NativeSelect
              id='sms-plantilla'
              label='Plantilla'
              placeholder={plantillas.length ? 'Selecciona...' : 'Sin plantillas disponibles'}
              opciones={plantillas.map((p) => ({ value: p.codigo, label: `${p.codigo} — ${p.nombre}` }))}
              value={plantillaCodigo}
              onChange={(e) => cambiarPlantilla(e.target.value)}
            />
            {plantilla ? (
              <>
                <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                  {modo === 'masivo' ? 'Variables comunes (las columnas del CSV con el mismo nombre las reemplazan por fila)' : 'Variables'}
                </p>
                <CamposVariables variables={plantilla.variables} valores={variables} onChange={setVariables} comunes={modo === 'masivo'} prefijoId='sms-var' />
              </>
            ) : null}
          </div>
        )}

        {vistaPrevia ? (
          <div className='rounded-xl border border-dashed border-border bg-muted/30 p-3'>
            <p className='mb-1 text-xs font-medium text-muted-foreground'>Vista previa{modo === 'masivo' && contenido === 'plantilla' ? ' (con las variables comunes)' : ''}</p>
            <p className='whitespace-pre-wrap break-words text-sm text-foreground'>{vistaPrevia}</p>
            <p className='mt-2 text-xs text-muted-foreground' data-testid='sms-segmentos'>
              {segmentos.longitud} caracteres · {segmentos.codificacion} · {segmentos.partes} SMS ({segmentos.porParte} por parte)
              {segmentos.codificacion === 'UCS2' ? ' — tildes o emojis reducen el tamaño por SMS' : ''}
            </p>
          </div>
        ) : null}
      </Bloque>

      <Bloque titulo='Destinatarios'>
        {modo === 'individual' ? (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='space-y-1.5 sm:col-span-2'>
              <Label htmlFor='sms-to'>Celular</Label>
              <Input id='sms-to' inputMode='tel' placeholder='3001234567' value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='sms-cc'>Indicativo</Label>
              <Input id='sms-cc' inputMode='numeric' placeholder='57 (opcional)' value={indicativo} onChange={(e) => setIndicativo(e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>
        ) : (
          <CargaDestinatarios
            key={reinicio}
            destinoColumnas={COLUMNAS_TELEFONO}
            esDestinoValido={(v) => TELEFONO.test(v)}
            normalizarDestino={normalizarTelefono}
            variablesPlantilla={contenido === 'plantilla' ? (plantilla?.variables ?? []).map((v) => v.nombre) : []}
            ejemploCsv={EJEMPLO_CSV_SMS}
            nombreEjemplo='destinatarios-sms.csv'
            maximo={MAX_DESTINOS_SMS}
            placeholder={'Un número por línea, o CSV con encabezado:\ntelefono,indicativo,nombre,codigo\n3001234567,57,Ana,4821'}
            onChange={setLectura}
          />
        )}
      </Bloque>

      <details className='rounded-2xl border border-border/60 bg-card p-5'>
        <summary className='cursor-pointer text-sm font-semibold text-foreground'>Opciones avanzadas</summary>
        <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='md:col-span-3'>{rutaSelect}</div>
          <NativeSelect
            id='sms-proveedor'
            label='Proveedor preferido'
            placeholder='Según la ruta'
            opciones={proveedores.map((p) => ({ value: p.codigo, label: p.nombre }))}
            value={rutaElegida ? '' : proveedor}
            disabled={Boolean(rutaElegida)}
            onChange={(e) => { setProveedor(e.target.value); setCuenta(''); }}
          />
          <NativeSelect
            id='sms-cuenta'
            label='Cuenta'
            placeholder='Según la ruta'
            opciones={cuentasProveedor.map((c) => ({ value: c.codigo, label: `${c.codigo} (${c.proveedor})` }))}
            value={rutaElegida ? '' : cuenta}
            disabled={Boolean(rutaElegida)}
            onChange={(e) => setCuenta(e.target.value)}
          />
          <div className='space-y-1.5'>
            <Label htmlFor='sms-sender'>Remitente (sender)</Label>
            <Input id='sms-sender' maxLength={20} placeholder='El de la cuenta' value={sender} onChange={(e) => setSender(e.target.value)} />
          </div>
        </div>
        <p className='mt-3 text-xs text-muted-foreground'>
          {rutaElegida
            ? `Se ejecutan los pasos de la ruta ${rutaElegida.valor} en orden (reintentos por paso y fallback al siguiente); proveedor y cuenta no aplican.`
            : modo === 'individual'
              ? 'Si no eliges nada, sms_gateway usa la ruta configurada para el tipo de mensaje, con fallback entre proveedores.'
              : 'El masivo usa la ruta del tipo de mensaje (la ruta por código solo aplica al envío individual).'}
        </p>
      </details>

      <AvisoError mensaje={error} />

      <div className='flex justify-end'>
        <Buttons type='button' className='inline-flex items-center gap-2' loading={enviando} disabled={enviando} onClick={enviar}>
          <HiOutlinePaperAirplane className='h-4 w-4' />
          {modo === 'individual' ? 'Enviar SMS' : `Enviar ${validas.length || ''} SMS`.replace('  ', ' ')}
        </Buttons>
      </div>
    </div>
  );
}
