/**
 * Se ejecuta una vez al arrancar el servidor de Next (dev y producción). Revisa las variables de
 * entorno y avisa en la consola las que faltan o ya no se usan, sin detener la app.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { verificarEntorno } = await import('./server/lib/env-check');
  verificarEntorno();
}
