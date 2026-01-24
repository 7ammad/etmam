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
