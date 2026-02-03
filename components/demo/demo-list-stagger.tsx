'use client'

/**
 * Demo: List with Framer Motion stagger on mount.
 * Respects prefers-reduced-motion (lib/motion.ts).
 */

import { motion } from 'framer-motion'
import { useStaggerListVariants, useMotionConfig } from '@/lib/motion'

const DEMO_ITEMS = [
  { id: 1, title: 'Tender Alpha', status: 'Qualified' },
  { id: 2, title: 'Tender Beta', status: 'Review' },
  { id: 3, title: 'Tender Gamma', status: 'Pending' },
  { id: 4, title: 'Tender Delta', status: 'Excluded' },
  { id: 5, title: 'Tender Epsilon', status: 'Qualified' },
]

export function DemoListStagger() {
  const { container, item } = useStaggerListVariants()
  const { reduceMotion } = useMotionConfig()

  return (
    <section aria-label="Demo list stagger">
      <motion.ul
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {DEMO_ITEMS.map((row) => (
          <motion.li
            key={row.id}
            variants={item}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            whileHover={
              reduceMotion
                ? undefined
                : { backgroundColor: 'var(--surface-muted)', transition: { duration: 0.15 } }
            }
          >
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.title}</span>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {row.status}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
