'use client'

import { useTranslations } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'

type Props = {
  locale: string
}

export function HomeContent({ locale }: Props) {
  const t = useTranslations('common')
  const tAuth = useTranslations('auth')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative">
      {/* Theme toggle in top corner */}
      <div className="absolute top-6 end-6">
        <ThemeToggle />
      </div>
      
      <h1 className="text-4xl font-bold text-primary-600">{t('appName')}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {tAuth('welcome')}
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href={`/${locale}/dashboard`}
          className="rounded-lg bg-primary-500 px-6 py-3 text-white hover:bg-primary-600 transition-colors"
        >
          {t('dashboard')}
        </a>
      </div>
    </main>
  )
}
