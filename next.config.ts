import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./shared/i18n/request.ts');

const shouldEmitStandalone = process.env.NEXT_OUTPUT_STANDALONE === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // swcMinify: true,
  output: shouldEmitStandalone ? 'standalone' : undefined,
  transpilePackages: ['@repo/ui'],
  experimental: {
    // Envíos masivos (hasta 5000 destinatarios) y adjuntos de correo en Base64 (máx. 20 MB) viajan por server actions.
    serverActions: { bodySizeLimit: '30mb' },
  },
  eslint: {
    // Por defecto Next sólo analiza app/, components/, lib/, pages/ y src/:
    // 'modules' y 'server' (la mayor parte del código) quedaban sin lint.
    dirs: ['app', 'components', 'lib', 'modules', 'server', 'shared', 'store'],
  },
};

export default withNextIntl(nextConfig);
