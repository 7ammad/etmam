'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { IconButton } from '@radix-ui/themes'

type Props = {
  className?: string
  /** Use on dark backgrounds (e.g. sidebar) for white icon */
  inverted?: boolean
}

export function ThemeToggle({ className, inverted }: Props) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  const iconColor = inverted ? 'white' : undefined
  const style = inverted ? { color: 'white' } : undefined

  if (!mounted) {
    return (
      <IconButton variant="ghost" color="gray" className={className} disabled style={style}>
        <Sun size={20} color={iconColor} />
      </IconButton>
    )
  }

  return (
    <IconButton
      variant="ghost"
      color="gray"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={className}
      aria-label="Toggle theme"
      style={style}
    >
      {theme === 'dark' ? (
        <Sun size={20} color={iconColor} />
      ) : (
        <Moon size={20} color={iconColor} />
      )}
    </IconButton>
  )
}
