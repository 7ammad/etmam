'use client'

import { LandingHeader } from './landing/landing-header'
import { HeroSection } from './landing/hero-section'
import { CapabilityShowcase } from './landing/capability-showcase'
import { LiveDemoStrip } from './landing/live-demo-strip'
import { HowItWorksSection } from './landing/how-it-works-section'
import { CTASection } from './landing/cta-section'
import { Footer } from './landing/footer'

type Props = {
  locale: string
}

/**
 * Landing page: Hero → Dual-Track Showcase (Infratech/Exotech) → Live Demo strip → How it works → CTA → Footer.
 * Generic FeaturesSection removed in favor of strategic CapabilityShowcase.
 */
export function HomeContent({ locale: _locale }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <CapabilityShowcase />
        <LiveDemoStrip />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
