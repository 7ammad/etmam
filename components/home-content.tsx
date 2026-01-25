'use client'

import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { LandingHeader } from './landing/landing-header'
import { HeroSection } from './landing/hero-section'
import { HowItWorksSection } from './landing/how-it-works-section'
import { FeaturesSection } from './landing/features-section'
import { FAQSection } from './landing/faq-section'
import { CTASection } from './landing/cta-section'
import { Footer } from './landing/footer'

type Props = {
  locale: string
}

export function HomeContent({ locale }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
