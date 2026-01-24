import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Create the next-intl plugin with the request config path
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default withNextIntl(nextConfig)
