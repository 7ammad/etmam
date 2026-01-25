'use client'

import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sidebar } from './sidebar'
import { useI18n } from '@/components/providers/i18n-provider'

type MobileDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { locale } = useI18n()
  const isRTL = locale === 'ar'
  const [mounted, setMounted] = useState(false)

  // Only render portal after client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleEscape])

  // Don't render portal until mounted on client
  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 'var(--z-overlay)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'opacity var(--duration-normal) var(--ease-out), visibility var(--duration-normal) var(--ease-out)',
        }}
      />
      
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isRTL ? 'قائمة التنقل' : 'Navigation menu'}
        style={{
          position: 'fixed',
          top: 0,
          [isRTL ? 'right' : 'left']: 0,
          height: '100vh',
          zIndex: 'var(--z-modal)',
          transform: isOpen 
            ? 'translateX(0)' 
            : isRTL 
              ? 'translateX(100%)' 
              : 'translateX(-100%)',
          transition: 'transform var(--duration-slow) var(--ease-out)',
          boxShadow: isOpen ? 'var(--shadow-2xl)' : 'none',
        }}
      >
        <Sidebar 
          isMobileDrawer 
          onClose={onClose}
          style={{
            height: '100%',
          }}
        />
      </div>
    </>,
    document.body
  )
}
