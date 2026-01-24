import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { notFound } from 'next/navigation'
import { getMessages, isValidLocale, type Locale } from '@/lib/i18n'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import '../globals.css'

// IBM Plex Sans Arabic - Primary font for Arabic-first UI
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Etmaam CRM | إتمام',
    template: '%s | إتمام',
  },
  description: 'Automated Tender Qualification & CRM Connector - نظام تأهيل المنافسات وربط CRM',
  keywords: ['tender', 'منافسة', 'CRM', 'تقييم', 'evaluation', 'Saudi Arabia'],
  authors: [{ name: 'Etmaam Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }]
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!isValidLocale(locale)) {
    notFound()
  }

  const messages = getMessages(locale)
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html
      lang={locale}
      dir={dir}
      className={ibmPlexArabic.variable}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-arabic antialiased">
        <ThemeProvider>
          <I18nProvider locale={locale} messages={messages}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
