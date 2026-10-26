import { z } from 'zod';
import { variablesDePlantilla } from '../utils/variables';

export const variableSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'Nombre obligatorio')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Letras, números y _ (empieza por letra)'),
  tipo_dato: z.enum(['TEXTO', 'ENTERO', 'DECIMAL', 'MONEDA', 'FECHA', 'HORA', 'URL']),
  obligatoria: z.boolean(),
  longitud_maxima: z.string().regex(/^\d*$/, 'Número entero'),
  patron: z.string().max(255),
  valor_defecto: z.string().max(500),
  descripcion: z.string().max(255),
});

export const plantillaSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(1, 'El código es obligatorio')
      .max(50, 'Máximo 50 caracteres')
      .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Solo letras, números, _ y -'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
    descripcion: z.string().trim().max(500, 'Máximo 500 caracteres'),
    tipo_mensaje: z.string(),
    asunto: z
      .string()
      .trim()
      .min(1, 'El asunto es obligatorio')
      .max(998, 'Máximo 998 caracteres')
      .refine((v) => !/[\r\n]/.test(v), 'El asunto no puede tener saltos de línea'),
    cuerpo_html: z.string().max(2_000_000, 'Máximo 2 MB'),
    cuerpo_texto: z.string().max(2_000_000, 'Máximo 2 MB'),
    variables: z.array(variableSchema),
  })
  .superRefine((v, ctx) => {
    if (!v.cuerpo_html.trim() && !v.cuerpo_texto.trim()) {
      ctx.addIssue({ code: 'custom', path: ['cuerpo_html'], message: 'Escribe el cuerpo HTML y/o el texto plano' });
    }
    // Mismas reglas que el gateway: toda {{variable}} usada debe estar declarada (las sin usar solo se advierten).
    const usadas = variablesDePlantilla(v.asunto, v.cuerpo_html, v.cuerpo_texto);
    const declaradas = v.variables.map((x) => x.nombre.trim());
    const faltan = usadas.filter((u) => !declaradas.includes(u));
    const repetidas = declaradas.filter((d, i) => d && declaradas.indexOf(d) !== i);
    if (faltan.length) ctx.addIssue({ code: 'custom', path: ['variables'], message: `Falta declarar: ${faltan.join(', ')}` });
    if (repetidas.length) ctx.addIssue({ code: 'custom', path: ['variables'], message: `Repetidas: ${[...new Set(repetidas)].join(', ')}` });
  });

export type PlantillaFormValues = z.infer<typeof plantillaSchema>;
