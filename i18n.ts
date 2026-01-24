import { getRequestConfig } from 'next-intl/server'

// Default config file for next-intl
// Can be referenced in next.config.ts with createNextIntlPlugin()
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Validate and fallback to default locale
  const validLocales = ['ar', 'en']
  if (!locale || !validLocales.includes(locale)) {
    locale = 'ar'
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
