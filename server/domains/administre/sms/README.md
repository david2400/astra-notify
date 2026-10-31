# server/domains/administre/sms

Acceso (solo servidor) a la administración de SMS:

| Recurso | Servicio |
|---|---|
| proveedores, cuentas, tipos-mensaje, servicios, rutas, cache | **notificacion** `/api/notificacion/v1/admin/sms/...` (`smsAdminFetch`, `NOTIFICACION_API_URL`, dev `http://localhost:9001`) |
| plantillas | **sms_gateway** por el proxy de notificacion `/api/notificacion/v1/gateway/sms/admin/plantillas` → `/v1/sms/admin/plantillas` (`smsGatewayFetch`) |

notificacion identifica proveedores, cuentas y tipos por **código**; las pantallas usan ids. `notificacion.ts`
tiene el contrato de notificacion y `catalogoSms()`, que traduce id ↔ código; cada `repository.ts` convierte las
respuestas al tipo de la pantalla (`types.ts`). Las tablas son las unificadas `Canal*` (canal = SMS).

Un subdominio por recurso, cada uno con el mismo patrón de draco:

| Archivo | Uso |
|---|---|
| `types.ts` | Tipos que usan las pantallas (snake_case) |
| `repository.ts` | Llamadas HTTP (`smsAdminFetch` / `smsGatewayFetch`) y conversión al tipo de la pantalla (`import 'server-only'`) |
| `queries.ts` | Lecturas para Server Components (envueltas en `cache` de React) |
| `actions.ts` | Mutaciones (`'use server'`): devuelven `ActionResult`, nunca lanzan |


