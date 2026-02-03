'use client'

/**
 * Demo: KPI cards with Framer Motion stagger on mount and value-change animation.
 * Respects prefers-reduced-motion (lib/motion.ts).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKpiCardVariants, useMotionConfig } from '@/lib/motion'
import { FileText } from 'lucide-react'

const DEMO_LABEL = 'Demo KPI'

export function DemoKpiMotion() {
  const [count, setCount] = useState(42)
  const { container, card } = useKpiCardVariants()
  const { reduceMotion, transition } = useMotionConfig()

  return (
    <section aria-label="Demo KPI animation">
      <motion.div
        className="dashboard-kpi-grid"
        variants={container}
        initial="hidden"
        animate="show"
        style={{ marginBottom: 'var(--space-4)' }}
      >
        {/* First card: animated value on change */}
        <motion.div
          variants={card}
          className="kpi-card"
          data-accent="primary"
          data-featured="true"
          data-testid="demo-kpi-1"
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-card)',
            padding: '18px 20px',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="kpi-icon-wrapper" data-accent="primary">
              <FileText size={20} aria-hidden />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={count}
                  className="kpi-value"
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
                  transition={transition}
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--text-primary)',
                  }}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {count.toLocaleString()}
                </motion.span>
              </AnimatePresence>
              <span className="kpi-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {DEMO_LABEL}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Second card: static for comparison */}
        <motion.div
          variants={card}
          className="kpi-card"
          data-accent="success"
          data-testid="demo-kpi-2"
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-card)',
            padding: '18px 20px',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="kpi-icon-wrapper" data-accent="success">✓</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                7
              </span>
              <span className="kpi-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Qualified
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <p style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Click to change the first KPI value (animates when prefers-reduced-motion is off):
      </p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        aria-label="Increment demo KPI value by 1"
        style={{
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary-500)',
          color: 'white',
          border: 'none',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        +1
      </button>
    </section>
  )
}
