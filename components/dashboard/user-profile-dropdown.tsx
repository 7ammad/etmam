'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/providers/auth-provider'
import { useTranslations } from '@/components/providers/i18n-provider'
import { logoutAction } from '@/actions/auth'
import { Avatar, DropdownMenu, Flex } from '@radix-ui/themes'
import { Settings, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

interface UserProfileDropdownProps {
  locale: string
}

/** User avatar that opens dropdown: Account settings, Theme (Dark/Light), Logout. No standalone logout icon. */
export function UserProfileDropdown({ locale }: UserProfileDropdownProps) {
  const user = useUser()
  const router = useRouter()
  const tAuth = useTranslations('auth')
  const tSettings = useTranslations('settings')
  const { setTheme } = useTheme()
  const [loading, setLoading] = useState(false)

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  const handleLogout = async () => {
    setLoading(true)
    const result = await logoutAction()
    if (result.success) {
      router.push(`/${locale}/login`)
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <button
          type="button"
          className="header-avatar-trigger"
          aria-label={tSettings('accountSettings')}
          style={{
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderRadius: '50%',
          }}
        >
          <Avatar
            size="2"
            radius="full"
            src={avatarUrl}
            fallback={initials}
            alt=""
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" size="2">
        <DropdownMenu.Label>{displayName}</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item asChild>
          <NextLink href={`/${locale}/settings`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Flex align="center" gap="2">
              <Settings size={16} />
              {tSettings('accountSettings')}
            </Flex>
          </NextLink>
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => setTheme('light')}>
          <Flex align="center" gap="2">
            <Sun size={16} />
            {tSettings('light')}
          </Flex>
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => setTheme('dark')}>
          <Flex align="center" gap="2">
            <Moon size={16} />
            {tSettings('dark')}
          </Flex>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item color="red" disabled={loading} onClick={handleLogout}>
          <Flex align="center" gap="2">
            <LogOut size={16} />
            {tAuth('logout')}
          </Flex>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
