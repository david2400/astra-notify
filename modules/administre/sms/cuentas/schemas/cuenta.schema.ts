import { z } from 'zod';

const esObjetoJson = (texto: string) => {
  if (!texto.trim()) return true;
  try {
    const valor = JSON.parse(texto);
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  } catch {
    return false;
  }
};

export const cuentaSchema = z.object({
  proveedor_id: z.string().min(1, 'Selecciona el proveedor'),
  codigo: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Za-z0-9_]+$/, 'Solo letras, números y _'),
  usuario: z.string().trim().max(100, 'Máximo 100 caracteres'),
  clave: z.string().max(200, 'Máximo 200 caracteres'),
  secret_ref: z
    .string()
    .trim()
    .max(100)
    .regex(/^([A-Za-z_][A-Za-z0-9_]*)?$/, 'Nombre de variable de entorno inválido'),
  remitente: z.string().trim().max(20, 'Máximo 20 caracteres'),
  parametros: z.string().refine(esObjetoJson, 'Debe ser un objeto JSON, ej. {"type":1}'),
});

export type CuentaFormValues = z.infer<typeof cuentaSchema>;
