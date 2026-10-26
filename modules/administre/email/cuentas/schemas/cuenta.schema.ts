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

export const cuentaSchema = z
  .object({
    proveedor: z.string().min(1, 'Selecciona el proveedor'),
    codigo: z
      .string()
      .trim()
      .min(1, 'El código es obligatorio')
      .max(50, 'Máximo 50 caracteres')
      .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Solo letras, números, _ y -'),
    usuario: z.string().trim().max(320, 'Máximo 320 caracteres'),
    remitente_email: z.string().trim().min(1, 'El remitente es obligatorio').email('Email inválido').max(320),
    remitente_nombre: z.string().trim().max(150, 'Máximo 150 caracteres'),
    auth_mode: z.enum(['APP_PASSWORD', 'OAUTH2']),
    clave: z.string().max(2500, 'Máximo 2500 caracteres'),
    oauth_client_id: z.string().trim().max(300),
    oauth_client_secret: z.string().trim().max(300),
    oauth_refresh_token: z.string().trim().max(1000),
    secret_ref: z
      .string()
      .trim()
      .max(100)
      .regex(/^([A-Za-z_][A-Za-z0-9_]*)?$/, 'Nombre de variable de entorno inválido'),
    eliminar_clave: z.boolean(),
    parametros: z.string().refine(esObjetoJson, 'Debe ser un objeto JSON, ej. {"batchSize":50}'),
  })
  .superRefine((v, ctx) => {
    const oauth = [v.oauth_client_id, v.oauth_client_secret, v.oauth_refresh_token];
    if (v.proveedor === 'GMAIL' && v.auth_mode === 'OAUTH2' && oauth.some(Boolean) && !oauth.every(Boolean)) {
      ctx.addIssue({ code: 'custom', path: ['oauth_refresh_token'], message: 'Completa client_id, client_secret y refresh_token (o deja los tres vacíos para conservar)' });
    }
  });

export type CuentaFormValues = z.infer<typeof cuentaSchema>;
