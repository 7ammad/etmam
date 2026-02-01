import arMessages from '@/messages/ar.json'
import enMessages from '@/messages/en.json'

export const locales = ['ar', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ar'

const messages = {
  ar: arMessages,
  en: enMessages,
} as const

export function getMessages(locale: Locale) {
  return messages[locale] || messages[defaultLocale]
}

/** Server-side t for a namespace (avoids next-intl plugin request config). Use in server components. */
export function getServerT(
  locale: Locale,
  namespace: string
): (key: string) => string {
  const messages = getMessages(locale) as Record<string, Record<string, unknown>>
  const ns = messages[namespace]
  if (!ns || typeof ns !== 'object') return (key: string) => key
  return function t(key: string): string {
    const parts = key.split('.')
    let value: unknown = ns
    for (const p of parts) {
      if (value != null && typeof value === 'object' && p in (value as object)) {
        value = (value as Record<string, unknown>)[p]
      } else {
        return key
      }
    }
    return typeof value === 'string' ? value : key
  }
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

// Simple translation function
export function createTranslator(messages: typeof arMessages) {
  return function t(key: string): string {
    const keys = key.split('.')
    let value: any = messages
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if not found
      }
    }
    
    return typeof value === 'string' ? value : key
  }
}

export type Messages = typeof arMessages
