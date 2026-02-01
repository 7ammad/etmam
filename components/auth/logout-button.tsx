'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@radix-ui/themes'
import { LogOut, Loader2 } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { useI18n, useTranslations } from '@/components/providers/i18n-provider'

interface LogoutButtonProps {
  variant?: 'solid' | 'soft' | 'outline' | 'ghost'
  size?: '1' | '2' | '3'
  showIcon?: boolean
  showText?: boolean
}

export function LogoutButton({
  variant = 'ghost',
  size = '2',
  showIcon = true,
  showText = true,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { locale } = useI18n()
  const t = useTranslations('auth')

  const handleLogout = async () => {
    setLoading(true)
    const result = await logoutAction()

    if (result.success) {
      router.push(`/${locale}/login`)
      router.refresh()
    } else {
      setLoading(false)
      console.error('Logout failed:', result.error)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      color="gray"
      onClick={handleLogout}
      disabled={loading}
      style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : showIcon ? (
        <LogOut size={16} />
      ) : null}
      {showText && t('logout')}
    </Button>
  )
}
