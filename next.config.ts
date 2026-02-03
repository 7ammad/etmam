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

/** Strip experimental.turbo (invalid in Next.js 16) if a plugin added it. Official: use top-level `turbopack`; codemod: npx @next/codemod@latest next-experimental-turbo-to-turbopack . See docs/BUILD_FIXES_OFFICIAL.md. */
function stripTurboFromConfig(config: NextConfig): NextConfig {
  if (config?.experimental && typeof config.experimental === 'object' && 'turbo' in config.experimental) {
    const experimental = { ...config.experimental } as Record<string, unknown>
    delete experimental.turbo
    return { ...config, experimental }
  }
  return config
}

const baseConfig = withNextIntl(nextConfig) as NextConfig | ((phase: string, defaultConfig: NextConfig) => NextConfig)
export default typeof baseConfig === 'function'
  ? (phase: string, defaultConfig: NextConfig) => stripTurboFromConfig(baseConfig(phase, defaultConfig))
  : stripTurboFromConfig(baseConfig)
