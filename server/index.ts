/**
 * Server-side data access layer.
 *
 * Import from domain-specific modules for tree-shaking:
 *
 *   import { getExams, createExamAction } from '@/server/domains/control-academico';
 *   import { getStudentProfile } from '@/server/domains/gestion-alumnos';
 *
 * Or import shared utilities:
 *
 *   import { serverFetch, ServerApiError } from '@/server/lib';
 */

export { serverFetch } from './lib/server-fetch';
export { env } from './lib/env';
export type { ListParams, PaginatedResponse, PaginationMeta, ServerFetchOptions } from './lib/types';
export { ServerApiError } from './lib/types';
export * from './lib/cache-tags';
