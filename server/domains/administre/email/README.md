# server/domains/administre/email

Acceso (solo servidor) a **email_gateway**. Independiente de `administre/sms`: otro servicio, otro cliente
(`emailGatewayFetch`, prefijo `/api/email_gateway/v1`) y otros contratos. Un subdominio por recurso:

| Archivo | Uso |
|---|---|
| `types.ts` | Contrato del backend (JSON snake_case; los campos nulos no se envían) |
| `repository.ts` | Llamadas HTTP con `emailGatewayFetch` (`import 'server-only'`) |
| `queries.ts` | Lecturas para Server Components (`cache` de React) |
| `actions.ts` | Mutaciones (`'use server'`): devuelven `ActionResult`, nunca lanzan |

A diferencia de sms_gateway, los recursos se identifican por **código** (proveedores, cuentas, tipos,
plantillas); las rutas por id. Base URL: `EMAIL_GATEWAY_API_URL` (dev: `http://localhost:9003`).
