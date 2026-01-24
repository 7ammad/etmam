'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Locale, Messages } from '@/lib/i18n'

type I18nContextType = {
  locale: Locale
  messages: Messages
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslations(namespace?: string) {
  const { t, messages } = useI18n()
  
  return (key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return t(fullKey, params)
  }
}

type I18nProviderProps = {
  children: ReactNode
  locale: Locale
  messages: Messages
}

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: unknown = messages
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return key // Return key if not found
      }
    }
    
    if (typeof value !== 'string') {
      return key
    }
    
    // Handle parameter interpolation like {count}
    if (params) {
      return value.replace(/{(\w+)}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{${paramKey}}`)
      })
    }
    
    return value
  }

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  )
}
