# server/domains/administre/email

Acceso (solo servidor) a la administración de email:

| Recurso | Servicio |
|---|---|
| proveedores, cuentas, tipos-mensaje, servicios, rutas, cache (rutas) | **notificacion** `/api/notificacion/v1/admin/email/...` (`emailAdminFetch`, `NOTIFICACION_API_URL`, dev `http://localhost:9001`) |
| plantillas, envíos, cache (plantillas) | **email_gateway** `/api/email_gateway/v1/...` (`emailGatewayFetch`, `EMAIL_GATEWAY_API_URL`, dev `http://localhost:9003`) |

Cada `repository.ts` convierte el contrato de notificacion al tipo de la pantalla (`remitente` ↔ `remitente_email`,
`clave_configurada` ↔ `tiene_clave_cifrada`, `configurada` ↔ `ok` en la ruta efectiva). Las tablas son las
unificadas `Canal*` (canal = EMAIL). Un subdominio por recurso:

| Archivo | Uso |
|---|---|
| `types.ts` | Tipos que usan las pantallas (JSON snake_case; los campos nulos no se envían) |
| `repository.ts` | Llamadas HTTP (`emailAdminFetch` / `emailGatewayFetch`) y conversión (`import 'server-only'`) |
| `queries.ts` | Lecturas para Server Components (`cache` de React) |
| `actions.ts` | Mutaciones (`'use server'`): devuelven `ActionResult`, nunca lanzan |

Los recursos se identifican por **código** (proveedores, cuentas, tipos, plantillas); las rutas por id.
Probar una cuenta requiere el código del proveedor (email_gateway): notificacion responde 422.
