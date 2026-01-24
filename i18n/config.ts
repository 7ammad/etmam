export const locales = ['ar', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ar'

// Type for messages
export type Messages = typeof import('../messages/ar.json')
