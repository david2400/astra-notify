/** @format */

'use client';

import { useMemo, useRef, useState } from 'react';
import { HiOutlineArrowDownTray, HiOutlineArrowUpTray } from 'react-icons/hi2';
import { Badge } from '@repo/ui/badges/scenes/badge';
import { Buttons } from '@repo/ui/buttons/scenes';
import { descargarCsv, leerDestinatarios, type LecturaDestinatarios } from '../utils/csv';

interface Props {
  /** 'telefono' o 'email': nombre de la columna principal (se aceptan sinónimos). */
  destinoColumnas: string[];
  esDestinoValido: (v: string) => boolean;
  normalizarDestino?: (v: string) => string;
  /** Variables que pide la plantilla seleccionada (para avisar las que faltan). */
  variablesPlantilla: string[];
  ejemploCsv: string;
  nombreEjemplo: string;
  maximo: number;
  placeholder: string;
  onChange: (lectura: LecturaDestinatarios) => void;
}

/**
 * Destinatarios para envío masivo: pegar una lista / CSV o cargar un archivo .csv (separador , ; o tabulador).
 * Valida cada fila, marca duplicados y avisa las variables de la plantilla que no vienen como columnas.
 */
export function CargaDestinatarios(props: Props) {
  const { destinoColumnas, esDestinoValido, normalizarDestino, variablesPlantilla, ejemploCsv, nombreEjemplo, maximo, placeholder, onChange } = props;
  const [texto, setTexto] = useState('');
  const [archivo, setArchivo] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const lectura = useMemo(
    () => leerDestinatarios(texto, { destinoColumnas, esDestinoValido, normalizarDestino }),
    [texto, destinoColumnas, esDestinoValido, normalizarDestino],
  );
  const validas = lectura.filas.filter((f) => !f.error);
  const invalidas = lectura.filas.filter((f) => f.error);
  const faltantes = variablesPlantilla.filter((v) => !lectura.columnasVariables.includes(v.toLowerCase()));

  const actualizar = (nuevo: string) => {
    setTexto(nuevo);
    onChange(leerDestinatarios(nuevo, { destinoColumnas, esDestinoValido, normalizarDestino }));
  };

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <input
          ref={input}
          type='file'
          accept='.csv,.txt,text/csv,text/plain'
          className='hidden'
          aria-label='Archivo CSV de destinatarios'
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setArchivo(f.name);
            actualizar(await f.text());
            e.target.value = '';
          }}
        />
        <Buttons type='button' size='sm' variant='outline' onClick={() => input.current?.click()}>
          <HiOutlineArrowUpTray className='h-4 w-4' /> Cargar CSV
        </Buttons>
        <Buttons type='button' size='sm' variant='ghost' onClick={() => descargarCsv(nombreEjemplo, ejemploCsv)}>
          <HiOutlineArrowDownTray className='h-4 w-4' /> Descargar ejemplo
        </Buttons>
        {archivo ? <span className='text-xs text-muted-foreground'>Archivo: {archivo}</span> : null}
      </div>
      <textarea
        id='destinatarios'
        aria-label='Destinatarios'
        rows={8}
        value={texto}
        placeholder={placeholder}
        onChange={(e) => actualizar(e.target.value)}
        className='w-full resize-y rounded-xl border border-input bg-background p-3 font-mono text-xs leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring'
      />
      {lectura.filas.length ? (
        <div className='space-y-2 rounded-xl border border-border p-3 text-sm'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='default'>{validas.length} válidos</Badge>
            {invalidas.length ? <Badge variant='destructive'>{invalidas.length} con error (se omiten)</Badge> : null}
            {validas.length > maximo ? <Badge variant='destructive'>Máximo {maximo} por envío</Badge> : null}
            {lectura.conEncabezado && lectura.columnasVariables.length ? (
              <span className='text-xs text-muted-foreground'>Variables por fila: {lectura.columnasVariables.join(', ')}</span>
            ) : null}
          </div>
          {faltantes.length ? (
            <p className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs'>
              La plantilla usa {faltantes.map((f) => `{{${f}}}`).join(', ')} y no vienen como columnas: se tomarán de las variables comunes
              o del valor por defecto (si son obligatorias y faltan, el gateway rechazará el envío).
            </p>
          ) : null}
          {invalidas.length ? (
            <ul className='max-h-28 overflow-y-auto text-xs text-destructive'>
              {invalidas.slice(0, 50).map((f) => (
                <li key={f.linea}>
                  Línea {f.linea + (lectura.conEncabezado ? 1 : 0)}: {f.destino || '(vacío)'} — {f.error}
                </li>
              ))}
            </ul>
          ) : null}
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead className='text-left text-muted-foreground'>
                <tr>
                  <th className='py-1 pr-3'>Destino</th>
                  <th className='py-1 pr-3'>Nombre</th>
                  {lectura.columnasVariables.filter((c) => c !== 'nombre').map((c) => (
                    <th key={c} className='py-1 pr-3'>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validas.slice(0, 5).map((f) => (
                  <tr key={f.linea} className='border-t border-border'>
                    <td className='py-1 pr-3 font-mono'>{f.destino}</td>
                    <td className='py-1 pr-3'>{f.nombre ?? ''}</td>
                    {lectura.columnasVariables.filter((c) => c !== 'nombre').map((c) => (
                      <td key={c} className='py-1 pr-3'>{f.variables[c] ?? ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {validas.length > 5 ? <p className='mt-1 text-xs text-muted-foreground'>… y {validas.length - 5} más</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
