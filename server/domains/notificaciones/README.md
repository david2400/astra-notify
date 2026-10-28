# server/domains/notificaciones

Envío de notificaciones desde el frontend (módulo `/notificaciones`), independiente de la administración:

| Subdominio | Gateway | Endpoints |
|---|---|---|
| `sms` | sms_gateway (`smsGatewayFetch`) | `POST /v1/sms/send`, `POST /v1/sms/batch`, `GET /v1/sms/envios`, `GET /v1/sms/envios/{id}` |
| `email` | email_gateway (`emailGatewayFetch`) | `POST /v1/email/send`, `POST /v1/email/lotes`, `GET /v1/email/lotes/{id}` (+ historial de `administre/email/envios`) |

Los catálogos (tipos de mensaje, plantillas) se leen con las queries de `administre/sms` y `administre/email` (solo lectura).
Las actions devuelven `ActionResult`; un SMS que falla en el proveedor (502 con el resultado) se devuelve como dato con estado FALLIDO.
