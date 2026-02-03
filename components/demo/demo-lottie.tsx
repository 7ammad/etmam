'use client'

/**
 * Demo: Lottie animation that respects prefers-reduced-motion.
 * When reduced, we show a static frame (no auto-play) to avoid motion.
 */

import { useRef, useEffect, useState } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { useMotionConfig } from '@/lib/motion'

/** Minimal Lottie data: circle fade in/out (from public/lottie/demo.json). */
let demoLottieData: object | null = null

async function loadDemoLottie(): Promise<object> {
  if (demoLottieData) return demoLottieData
  const res = await fetch('/lottie/demo.json')
  if (!res.ok) throw new Error('Failed to load Lottie')
  demoLottieData = (await res.json()) as object
  return demoLottieData
}

export function DemoLottie() {
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const { reduceMotion } = useMotionConfig()
  const [data, setData] = useState<object | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDemoLottie().then(setData).catch(() => setError('Lottie load failed'))
  }, [])

  useEffect(() => {
    if (!data || !lottieRef.current) return
    if (reduceMotion) {
      // Stop at first frame; no animation (WCAG 2.2)
      lottieRef.current.goToAndStop(0, true)
    } else {
      lottieRef.current.play()
    }
  }, [data, reduceMotion])

  // When reduced motion, stop at frame 0 as soon as Lottie is ready (ref may lag one commit)
  const onDataReady = reduceMotion
    ? () => lottieRef.current?.goToAndStop(0, true)
    : undefined

  if (error) {
    return (
      <div
        style={{
          width: 120,
          height: 120,
          background: 'var(--surface-muted)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
        }}
      >
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div
        style={{
          width: 120,
          height: 120,
          background: 'var(--surface-muted)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
        }}
      >
        Loading…
      </div>
    )
  }

  return (
    <div
      style={{ width: 120, height: 120 }}
      role="img"
      aria-label={reduceMotion ? 'Static decorative graphic' : 'Animated decorative graphic'}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={data}
        loop={!reduceMotion}
        autoplay={!reduceMotion}
        onDataReady={onDataReady}
        style={{ width: 120, height: 120 }}
      />
    </div>
  )
}
