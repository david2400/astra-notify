/** Server-only environment helpers – never import from client code. */

let hasWarnedMissingApiBaseUrl = false;

export const env = {
  /** Internal API base URL (server → backend, not exposed to the browser). */
  get apiBaseUrl(): string {
    const candidates = [
      process.env.API_BASE_URL,
      process.env.NEXT_PUBLIC_API_BASE_URL,
      process.env.NEXT_PUBLIC_API_URL,
      process.env.API_DEV_BASE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ];

    const resolvedCandidate = candidates.find(
      (candidate): candidate is string => Boolean(candidate),
    );

    const devFallback =
      process.env.NODE_ENV !== 'production'
        ? `http://localhost:${process.env.DEV_API_PORT ?? 8081}`
        : undefined;

    const url = resolvedCandidate ?? devFallback ?? '';

    if (!resolvedCandidate && devFallback && !hasWarnedMissingApiBaseUrl) {
      console.warn(
        `⚠️  [env] API_BASE_URL is not configured. Defaulting to ${devFallback}. ` +
          'Set API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) to silence this warning.',
      );
      hasWarnedMissingApiBaseUrl = true;
    }

    if (!url) {
      throw new Error(
        '[env] API_BASE_URL is not configured. Set it in your .env file.',
      );
    }

    return url.replace(/\/+$/, '');
  },

  /** access_control base URL (usuarios/empresas/clientes centralizados). */
  get accessControlBaseUrl(): string {
    const candidates = [
      process.env.ACCESS_CONTROL_API_URL,
      process.env.NEXT_PUBLIC_ACCESS_CONTROL_API_URL,
    ];

    const resolvedCandidate = candidates.find(
      (candidate): candidate is string => Boolean(candidate),
    );

    const devFallback =
      process.env.NODE_ENV !== 'production'
        ? `http://localhost:${process.env.DEV_ACCESS_CONTROL_PORT ?? 8000}`
        : undefined;

    const url = resolvedCandidate ?? devFallback ?? '';

    if (!url) {
      throw new Error(
        '[env] ACCESS_CONTROL_API_URL is not configured. Set it in your .env file.',
      );
    }

    return url.replace(/\/+$/, '');
  },

  /**
   * parametros base URL (catalogos: tipos de documento, ciudades, etc.).
   * Mismo patron que accessControlBaseUrl: servicio propio, puerto propio.
   */
  get parametrosBaseUrl(): string {
    const candidates = [
      process.env.PARAMETROS_API_URL,
      process.env.NEXT_PUBLIC_PARAMETROS_API_URL,
    ];

    const resolvedCandidate = candidates.find(
      (candidate): candidate is string => Boolean(candidate),
    );

    const devFallback =
      process.env.NODE_ENV !== 'production'
        ? `http://localhost:${process.env.DEV_PARAMETROS_PORT ?? 8001}`
        : undefined;

    const url = resolvedCandidate ?? devFallback ?? '';

    if (!url) {
      throw new Error(
        '[env] PARAMETROS_API_URL is not configured. Set it in your .env file.',
      );
    }

    return url.replace(/\/+$/, '');
  },

  /**
   * sms_gateway (motor de SMS/WhatsApp y su administración). Servicio propio con prefijo
   * /api/sms_gateway; ver smsGatewayFetch en server-fetch.ts.
   */
  get smsGatewayBaseUrl(): string {
    const resolved = process.env.SMS_GATEWAY_API_URL ?? process.env.NEXT_PUBLIC_SMS_GATEWAY_API_URL;
    const devFallback =
      process.env.NODE_ENV !== 'production'
        ? `http://localhost:${process.env.DEV_SMS_GATEWAY_PORT ?? 9002}`
        : undefined;
    const url = resolved ?? devFallback ?? '';
    if (!url) {
      throw new Error('[env] SMS_GATEWAY_API_URL is not configured. Set it in your .env file.');
    }
    return url.replace(/\/+$/, '');
  },

  get isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  },

  get isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  },
} as const;
