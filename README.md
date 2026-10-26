# astra-notify

Frontend de la plataforma de notificaciones (SMS, WhatsApp, correo). Creado con la misma
estructura y configuración de `apps/draco`: Next.js 15 (App Router), React 19, Tailwind 4,
`@repo/ui`, next-intl (`/es`, `/en`), Auth.js contra access_control, React Query y Redux.

## Arranque

```bash
# desde la raíz del monorepo
pnpm install
cp apps/astra-notify/.env.example apps/astra-notify/.env.local   # y completar
pnpm --filter astra-notify dev        # http://localhost:3000
```

Scripts: `dev`, `build`, `start`, `lint`, `check-types`.

## Estructura

```
app/
  [locale]/
    (public)/auth/login     login (pantalla completa)
    (protected)/            área con sesión: navbar + footer (layout.tsx)
      page.tsx              inicio: menú de módulos (shared/navegacion.ts)
      notificaciones/envios módulo de ejemplo
      administre/sms/       administración de sms_gateway (una carpeta por módulo)
      administre/email/     administración de email_gateway (módulo independiente)
  api/auth/[...nextauth]    handlers de Auth.js
  style/globals.css         paleta de colores (variables CSS)
auth.ts                     Auth.js: OIDC (access_control) o usuario/contraseña
middleware.ts               idioma + sesión obligatoria + renovación del token
components/                 layout, navbar, footer, data-table, feedback
modules/<dominio>/<feature> components / models / schemas / scenes / index.ts
server/
  lib/                      serverFetch, env, tipos, cache tags (solo servidor)
  domains/auth              usuario actual, contextos, cerrar sesión
shared/
  i18n/                     routing, request y mensajes (es/en)
  navegacion.ts             menú único (navbar + inicio)
store/                      Redux (slice de idioma)
lib/                        providers (React Query, sesión, Redux, idioma)
types/next-auth.d.ts        campos extra de la sesión
```

## Administración SMS (`/administre/sms`)

Pantallas sobre la API de administración de **sms_gateway** (`SMS_GATEWAY_API_URL`, dev `http://localhost:9002`).
Cada función es un módulo independiente con el mismo patrón:

| Módulo | Ruta | Qué hace |
|---|---|---|
| `resumen` | `/administre/sms` | Conteos y alertas (proveedor sin módulo, cuenta en rutas sin credenciales, ruta sin pasos) |
| `proveedores` | `/administre/sms/proveedores` | Alta/edición, timeouts, activar/desactivar |
| `cuentas` | `/administre/sms/cuentas` | Usuario, clave cifrada o variable de entorno, remitente, parámetros JSON |
| `tipos_mensaje` | `/administre/sms/tipos-mensaje` | Catálogo (canal, OTP, masivo), eliminar |
| `servicios` | `/administre/sms/servicios` | Tipos de mensaje que atiende cada proveedor |
| `rutas` | `/administre/sms/rutas` | Pasos ordenados (cuenta, intentos, espera), ruta efectiva con advertencias |
| `plantillas` | `/administre/sms/plantillas` | Contenido con `{{variables}}`, validación y previsualización (codificación y partes) |
| `shared` | — | Navegación por pestañas, encabezado, badges, selects, feedback (SweetAlert), refrescar caché |

Código: `modules/administre/sms/<modulo>` (UI), `server/domains/administre/sms/<recurso>` (API) y
`app/[locale]/(protected)/administre/sms/<ruta>` (página + `actions.ts`). Las server actions devuelven
`ActionResult` (`{ success, data | error }`) para mostrar el mensaje real del gateway también en producción.

## Administración Email (`/administre/email`)

Módulo **independiente** del de SMS (otro servicio, otro cliente HTTP y otros contratos) sobre
**email_gateway** (`EMAIL_GATEWAY_API_URL`, dev `http://localhost:9003`, cliente `emailGatewayFetch`).
No importa nada de `administre/sms`: tiene su propio `shared`.

| Módulo | Ruta | Qué hace |
|---|---|---|
| `resumen` | `/administre/email` | Cola (pendientes, en reintento, fallidos), conteos y alertas (sin implementación, cuenta en rutas sin credenciales, remitente de ejemplo, ruta sin pasos) |
| `envios` | `/administre/email/envios` | Historial paginado con filtros, detalle (intentos por paso, eventos de entrega, adjuntos), cancelar, reintentar y **envío de prueba** síncrono |
| `proveedores` | `/administre/email/proveedores` | Gmail (host SMTP), Brevo (URL API), Mock; timeouts, servicios, activar/desactivar |
| `cuentas` | `/administre/email/cuentas` | Remitente, contraseña de aplicación / OAuth2 (Gmail) / api-key (Brevo) cifradas, `secret_ref`, parámetros (límites), **probar conexión** |
| `tipos_mensaje` | `/administre/email/tipos-mensaje` | Catálogo con prioridad en la cola (1–9) y masivo |
| `servicios` | `/administre/email/servicios` | Tipos de mensaje que atiende cada proveedor |
| `rutas` | `/administre/email/rutas` | Pasos de fallback (cuenta, intentos, espera base del backoff) y **simulador** de ruta efectiva (proveedor preferido / cuenta) |
| `plantillas` | `/administre/email/plantillas` | Asunto + HTML + texto con `{{variables}}`, paleta que inserta en el campo enfocado, vista previa HTML aislada (iframe sandbox), validación en el gateway |
| `shared` | — | Pestañas, encabezado, badges de estado/entrega, selects, feedback, refrescar caché |

Código: `modules/administre/email/<modulo>`, `server/domains/administre/email/<recurso>` y
`app/[locale]/(protected)/administre/email/<ruta>`. Los recursos se identifican por código (las rutas por id).

## Agregar un módulo

1. `modules/<dominio>/<feature>/` con `components`, `models`, `schemas`, `scenes` e `index.ts`.
2. Datos del backend en `server/domains/<dominio>` (repository + queries con `serverFetch`).
3. Página en `app/[locale]/(protected)/<dominio>/<feature>/page.tsx` que carga datos y renderiza la scene.
4. Entrada en `shared/navegacion.ts` y título en `shared/i18n/message/{es,en}.json` (`Titles`).

## Notas

- El login es **opcional**: todas las páginas abren con o sin sesión. Si el usuario inicia sesión se usan
  su nombre y su token. `AUTH_REQUIRED=true` vuelve a exigir login; sin `AUTH_SECRET` se trabaja sin sesión.

- La cookie de sesión se llama `astra-notify.session-token` (ver `auth.ts`) para no chocar con
  las otras apps del monorepo en localhost, donde las cookies no distinguen puerto.
- Puerto por defecto 3000, igual que Next: si corres draco al mismo tiempo usa `pnpm dev -- -p 3001`.
