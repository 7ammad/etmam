'use client'

import { useEffect } from 'react'
import Script from 'next/script'

type Props = {
  locale: string
}

export function LocaleHtmlAttributes({ locale }: Props) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    // Also set via useEffect as a fallback
    document.documentElement.setAttribute('lang', locale)
    document.documentElement.setAttribute('dir', dir)
  }, [locale, dir])

  // Use inline script to set attributes immediately, before React hydration
  return (
    <Script
      id="locale-attrs"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          document.documentElement.setAttribute('lang', '${locale}');
          document.documentElement.setAttribute('dir', '${dir}');
        `,
      }}
    />
  )
}
