# server/domains/administre/sms

Acceso (solo servidor) a la administración de **sms_gateway**. Un subdominio por recurso, cada uno con
el mismo patrón de draco:

| Archivo | Uso |
|---|---|
| `types.ts` | Contrato del backend (JSON en snake_case, como lo serializa sms_gateway) |
| `repository.ts` | Llamadas HTTP con `smsGatewayFetch` (`import 'server-only'`) |
| `queries.ts` | Lecturas para Server Components (envueltas en `cache` de React) |
| `actions.ts` | Mutaciones (`'use server'`): devuelven `ActionResult`, nunca lanzan |

Base URL: `SMS_GATEWAY_API_URL` (dev: `http://localhost:9002`).
