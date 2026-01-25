import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { getMessages, isValidLocale, type Locale } from '@/lib/i18n'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { LocaleHtmlAttributes } from '@/components/locale-html-attributes'

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

  return (
    <>
      <LocaleHtmlAttributes locale={locale} />
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
    </>
  )
}
