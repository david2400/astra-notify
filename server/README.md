# Server Data Access Layer

Capa de acceso a datos server-side optimizada para **Next.js 15 Server Components**.

## Arquitectura

```
server/
├── lib/                          # Infraestructura compartida
│   ├── env.ts                    # Variables de entorno (server-only)
│   ├── server-fetch.ts           # HTTP client con native fetch + Next.js cache
│   ├── cache-tags.ts             # Tags centralizados para revalidación on-demand
│   ├── types.ts                  # Tipos genéricos (ApiResponse, ListParams, ServerApiError)
│   └── index.ts                  # Barrel export
│
├── domains/                      # Separación por dominio de negocio
│   ├── auth/
│   ├── admisiones/
│   ├── control-academico/
│   ├── estructura-institucion/
│   ├── gestion-alumnos/
│   ├── pqrs/
│   └── vehiculo/
│       ├── types.ts              # Tipos del dominio (modelos, DTOs)
│       ├── repository.ts         # Acceso a datos con cache tags
│       ├── queries.ts            # Funciones cacheadas con React.cache() para Server Components
│       ├── actions.ts            # Server Actions ('use server') para mutaciones
│       └── index.ts              # Barrel export del dominio
│
└── index.ts                      # Export principal de utilidades
```

## Capas

### 1. `types.ts` — Tipos del dominio
Interfaces TypeScript para modelos, DTOs de creación/actualización y enums.

### 2. `repository.ts` — Acceso a datos
- Usa `serverFetch` (native `fetch` con integración Next.js cache)
- Configura `revalidate` (TTL en segundos) y `tags` por endpoint
- Datos estáticos (grados, aulas): TTL alto (120-300s)
- Datos dinámicos (exámenes, inscripciones): TTL bajo (30s)
- Mutaciones: `revalidate: false` (sin cache)

### 3. `queries.ts` — Funciones de lectura para Server Components
- Envueltas en `React.cache()` para deduplicación dentro del mismo render
- Incluyen **queries compuestas BFF** (e.g. `getExamWithDetails`, `getStudentProfile`)
- Importar con `import 'server-only'` para prevenir uso en Client Components

### 4. `actions.ts` — Server Actions para mutaciones
- Marcadas con `'use server'`
- Retornan `ActionResult<T>` (discriminated union: `success | error`)
- Invalidan cache tags relevantes tras cada mutación
- Manejo de errores centralizado con `ServerApiError`

## Uso

### En un Server Component (lectura)

```tsx
// app/[locale]/(protected)/control-academico/exams/page.tsx
import { getExams } from '@/server/domains/control-academico';

export default async function ExamsPage() {
  const { data: exams, meta } = await getExams({ page: 1, per_page: 20 });

  return (
    <div>
      {exams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
      <Pagination meta={meta} />
    </div>
  );
}
```

### En un Server Component (BFF composite query)

```tsx
// app/[locale]/(protected)/gestion-alumnos/students/[id]/page.tsx
import { getStudentProfile } from '@/server/domains/gestion-alumnos';

export default async function StudentDetailPage({ params }: { params: { id: number } }) {
  const { student, guardians, relationships } = await getStudentProfile(Number(params.id));

  return <StudentProfileView student={student} guardians={guardians} />;
}
```

### En un Client Component (mutación via Server Action)

```tsx
'use client';

import { createExamAction } from '@/server/domains/control-academico';

function CreateExamForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createExamAction({
      nombre: formData.get('nombre') as string,
      code: formData.get('code') as string,
      // ...
    });

    if (result.success) {
      // redirect or show success
    } else {
      // show result.error
    }
  }

  return <form action={handleSubmit}>...</form>;
}
```

## Cache Strategy

| Dato | TTL (s) | Justificación |
|------|---------|---------------|
| Grados, Aulas | 300 | Cambian raramente |
| Temas, Criterios | 120 | Semi-estáticos |
| Grupos, Estudiantes | 60 | Cambios moderados |
| Exámenes, Inscripciones | 30 | Datos activos |
| Sesión, Mutaciones | `false` | Siempre frescos |

## Revalidación On-Demand

Cada Server Action invalida los tags relevantes:

```ts
// Después de crear un examen:
revalidateTag('control-academico:exams');

// Después de actualizar un estudiante específico:
revalidateTag('alumnos:student:42');
```

## Seguridad

- **`server-only`**: Previene importación accidental en Client Components
- **Auth headers**: Se propagan automáticamente desde cookies de sesión
- **`API_BASE_URL`**: Variable server-only (sin `NEXT_PUBLIC_` prefix recomendado)
- **Error sanitization**: `ServerApiError` normaliza errores sin exponer detalles internos

## Convenciones

- Nombres de archivos: `kebab-case` para carpetas de dominio
- Tipos: prefijo `I` para interfaces, sufijo `Payload` para DTOs de entrada
- Actions: sufijo `Action` (e.g. `createExamAction`)
- Queries: prefijo `get` (e.g. `getExamById`)
- Cache tags: `dominio:entidad` o `dominio:entidad:id`
