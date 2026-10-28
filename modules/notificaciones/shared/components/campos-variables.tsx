/** @format */

'use client';

import { Input } from '@repo/ui/inputs/scenes/input';
import { Label } from '@repo/ui/label/scenes/label';

/** Variable de plantilla (común a sms_gateway y email_gateway). */
export interface VariableCampo {
  nombre: string;
  obligatoria?: boolean;
  valor_defecto?: string | null;
  descripcion?: string | null;
  tipo_dato?: string;
}

interface Props {
  variables: VariableCampo[];
  valores: Record<string, string>;
  onChange: (valores: Record<string, string>) => void;
  /** En masivo las obligatorias pueden venir por fila: no se marcan como requeridas aquí. */
  comunes?: boolean;
  prefijoId?: string;
}

const tipoInput = (tipo?: string) => (tipo === 'NUMERO' || tipo === 'NUMBER' ? 'number' : tipo === 'FECHA' || tipo === 'DATE' ? 'date' : 'text');

/** Un campo por variable de la plantilla seleccionada (placeholder = valor por defecto). */
export function CamposVariables({ variables, valores, onChange, comunes = false, prefijoId = 'var' }: Props) {
  if (!variables.length) return <p className='text-xs text-muted-foreground'>La plantilla no tiene variables.</p>;
  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
      {variables.map((v) => {
        const id = `${prefijoId}-${v.nombre}`;
        const requerida = !!v.obligatoria && !v.valor_defecto && !comunes;
        return (
          <div key={v.nombre} className='space-y-1.5'>
            <Label htmlFor={id}>
              {`{{${v.nombre}}}`}
              {requerida ? <span className='text-destructive'> *</span> : null}
            </Label>
            <Input
              id={id}
              type={tipoInput(v.tipo_dato)}
              value={valores[v.nombre] ?? ''}
              placeholder={v.valor_defecto ? `Por defecto: ${v.valor_defecto}` : v.obligatoria ? 'Obligatoria' : 'Opcional'}
              onChange={(e) => onChange({ ...valores, [v.nombre]: e.target.value })}
            />
            {v.descripcion ? <p className='text-xs text-muted-foreground'>{v.descripcion}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

/** Variables obligatorias sin valor ni valor por defecto. */
export const variablesFaltantes = (variables: VariableCampo[], valores: Record<string, string>) =>
  variables.filter((v) => v.obligatoria && !v.valor_defecto && !valores[v.nombre]?.trim()).map((v) => v.nombre);

/** Quita las variables vacías (el gateway aplica el valor por defecto). */
export const soloConValor = (valores: Record<string, string>) =>
  Object.fromEntries(Object.entries(valores).filter(([, v]) => v.trim() !== '').map(([k, v]) => [k, v.trim()]));

/** Sustituye {{variable}} para la vista previa local (las faltantes quedan visibles). */
export const aplicarVariables = (texto: string, valores: Record<string, string>, defectos: Record<string, string> = {}) =>
  texto.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k: string) => valores[k]?.trim() || defectos[k] || m);
