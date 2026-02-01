import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Default: plugin discovers i18n/request.ts at project root
const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default withNextIntl(nextConfig)
