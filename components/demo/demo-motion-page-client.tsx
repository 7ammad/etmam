'use client'

/**
 * Client content for the demo-motion route.
 * Composes KPI animation, list stagger, and Lottie demos.
 */

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DemoKpiMotion } from './demo-kpi-motion'
import { DemoListStagger } from './demo-list-stagger'
import { DemoLottie } from './demo-lottie'

export function DemoMotionPageClient() {
  const params = useParams()
  const locale = (params?.locale as string) || 'en'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface-page)',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ maxWidth: 640, marginInline: 'auto' }}>
        <Link
          href={`/${locale}/dashboard`}
          style={{
            display: 'inline-block',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-link)',
            fontWeight: 600,
          }}
          aria-label="Back to Dashboard"
        >
          <span aria-hidden="true">{locale === 'ar' ? '→' : '←'}</span>{' '}
          Back to Dashboard
        </Link>

        <h1
          style={{
            margin: 0,
            marginBottom: 'var(--space-2)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Motion & Lottie Demo
        </h1>
        <p
          style={{
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          Framer Motion (KPI change, list stagger) and Lottie. Animations respect{' '}
          <code style={{ background: 'var(--surface-muted)', padding: '2px 6px', borderRadius: 4 }}>
            prefers-reduced-motion
          </code>
          .
        </p>

        <section aria-labelledby="demo-kpi-heading" style={{ marginBottom: 'var(--space-8)' }}>
          <h2
            id="demo-kpi-heading"
            style={{
              margin: 0,
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            1. KPI card stagger + value change
          </h2>
          <DemoKpiMotion />
        </section>

        <section aria-labelledby="demo-list-heading" style={{ marginBottom: 'var(--space-8)' }}>
          <h2
            id="demo-list-heading"
            style={{
              margin: 0,
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            2. List stagger + row hover
          </h2>
          <DemoListStagger />
        </section>

        <section aria-labelledby="demo-lottie-heading">
          <h2
            id="demo-lottie-heading"
            style={{
              margin: 0,
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            3. Lottie (pauses when reduced motion)
          </h2>
          <DemoLottie />
        </section>
      </div>
    </div>
  )
}
