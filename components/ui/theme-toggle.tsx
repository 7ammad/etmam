'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { IconButton } from '@radix-ui/themes'

type Props = {
  className?: string
}

export function ThemeToggle({ className }: Props) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <IconButton variant="ghost" color="gray" className={className} disabled>
        <Sun size={20} />
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
    >
      {theme === 'dark' ? (
        <Sun size={20} />
      ) : (
        <Moon size={20} />
      )}
    </IconButton>
  )
}
