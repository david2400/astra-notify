import { z } from 'zod';
import { variablesDelContenido } from '../utils/variables';

export const variableSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'Nombre obligatorio')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Solo letras, números y _'),
  tipo_dato: z.enum(['TEXTO', 'ENTERO', 'DECIMAL', 'MONEDA', 'FECHA', 'HORA', 'URL']),
  obligatoria: z.boolean(),
  longitud_max: z.string().regex(/^\d*$/, 'Número entero'),
  patron: z.string().max(200),
  valor_defecto: z.string().max(200),
  descripcion: z.string().max(255),
});

export const plantillaSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(1, 'El código es obligatorio')
      .max(50, 'Máximo 50 caracteres')
      .regex(/^[A-Za-z0-9_]+$/, 'Solo letras, números y _'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
    descripcion: z.string().trim().max(255, 'Máximo 255 caracteres'),
    tipo_mensaje: z.string(),
    contenido: z.string().trim().min(1, 'El contenido es obligatorio').max(1600, 'Máximo 1600 caracteres'),
    variables: z.array(variableSchema),
  })
  .superRefine((valores, ctx) => {
    // Mismas reglas que valida el gateway: toda {{variable}} declarada y sin declaraciones de sobra.
    const usadas = variablesDelContenido(valores.contenido);
    const declaradas = valores.variables.map((v) => v.nombre.trim());
    const faltan = usadas.filter((u) => !declaradas.includes(u));
    const sobran = declaradas.filter((d) => d && !usadas.includes(d));
    const repetidas = declaradas.filter((d, i) => d && declaradas.indexOf(d) !== i);
    if (faltan.length) {
      ctx.addIssue({ code: 'custom', path: ['variables'], message: `Falta declarar: ${faltan.join(', ')}` });
    }
    if (sobran.length) {
      ctx.addIssue({ code: 'custom', path: ['variables'], message: `No se usan en el contenido: ${sobran.join(', ')}` });
    }
    if (repetidas.length) {
      ctx.addIssue({ code: 'custom', path: ['variables'], message: `Repetidas: ${[...new Set(repetidas)].join(', ')}` });
    }
  });

export type PlantillaFormValues = z.infer<typeof plantillaSchema>;
