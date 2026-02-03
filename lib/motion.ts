/**
 * Motion config aligned with styles/tokens.css and docs/ux-ui-upgrade-plan.json.
 * Respects prefers-reduced-motion (WCAG 2.2); when reduced, animations are disabled.
 *
 * Official Motion docs (motion.dev) use package "motion" and import from "motion/react"
 * (e.g. useReducedMotion from "motion/react"). This project uses "framer-motion";
 * we implement reduced-motion via matchMedia so we don't depend on the package's
 * hook export and stay compatible with both framer-motion and future "motion" migration.
 */

'use client'

import { useSyncExternalStore } from 'react'

/** Prefers-reduced-motion: when true, disable or minimize animations (WCAG 2.2). */
function useReducedMotion(): boolean {
  const get = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const subscribe = (cb: () => void) => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    mql.addEventListener('change', cb)
    return () => mql.removeEventListener('change', cb)
  }
  return useSyncExternalStore(subscribe, get, () => false)
}

/** Token-like durations in seconds for Framer Motion (tokens.css uses ms). */
const DURATION_NORMAL = 0.2
const DURATION_SLOW = 0.3
const STAGGER_DELAY = 0.05

/** Ease-out from tokens.css: cubic-bezier(0, 0, 0.2, 1) */
const EASE_OUT = [0, 0, 0.2, 1] as const

/**
 * Returns transition config that respects prefers-reduced-motion.
 * Use for KPI value change, list stagger, and hover micro-interactions.
 */
export function useMotionConfig() {
  const shouldReduceMotion = useReducedMotion()

  return {
    /** When true, disable or minimize animations (WCAG 2.2). */
    reduceMotion: Boolean(shouldReduceMotion),
    /** Base transition: duration 0 when reduced, else token-based. */
    transition: {
      duration: shouldReduceMotion ? 0 : DURATION_NORMAL,
      ease: EASE_OUT,
    },
    /** Slightly longer for emphasis (e.g. list stagger). */
    transitionSlow: {
      duration: shouldReduceMotion ? 0 : DURATION_SLOW,
      ease: EASE_OUT,
    },
    /** Delay between staggered children; 0 when reduced. */
    staggerDelay: shouldReduceMotion ? 0 : STAGGER_DELAY,
  }
}

/** Variants for staggered list mount (use with motion.ul + motion.li). */
export function useStaggerListVariants() {
  const { reduceMotion, staggerDelay, transition } = useMotionConfig()

  const container = {
    hidden: { opacity: reduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0,
      },
    },
  }

  const item = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 },
    show: {
      opacity: 1,
      y: 0,
      transition,
    },
  }

  return { container, item }
}

/** Variants for KPI card stagger on mount. */
export function useKpiCardVariants() {
  const { reduceMotion, staggerDelay, transition } = useMotionConfig()

  const container = {
    hidden: { opacity: reduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0,
      },
    },
  }

  const card = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 },
    show: {
      opacity: 1,
      y: 0,
      transition,
    },
  }

  return { container, card }
}
