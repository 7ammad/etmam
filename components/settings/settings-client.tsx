'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Link } from '@/i18n/routing'
import { Flex, Text, Heading, Box } from '@radix-ui/themes'
import {
  Globe,
  Sun,
  Moon,
  Monitor,
  Database,
  Bell,
  User,
  ChevronRight,
  Check,
  ExternalLink,
} from 'lucide-react'

interface SettingsClientProps {
  locale: string
}

type SettingsTab = 'general' | 'crm' | 'notifications' | 'account'

export function SettingsClient({ locale }: SettingsClientProps) {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const { locale: currentLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const isRTL = currentLocale === 'ar'
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  const tabs = [
    { id: 'general' as const, label: isRTL ? 'عام' : 'General', icon: Globe },
    { id: 'crm' as const, label: isRTL ? 'ربط CRM' : 'CRM Integration', icon: Database },
    { id: 'notifications' as const, label: isRTL ? 'الإشعارات' : 'Notifications', icon: Bell },
    { id: 'account' as const, label: isRTL ? 'الحساب' : 'Account', icon: User },
  ]

  const languages = [
    { code: 'ar', label: 'العربية', nativeLabel: 'Arabic' },
    { code: 'en', label: 'English', nativeLabel: 'إنجليزي' },
  ]

  const themes = [
    { id: 'light', label: isRTL ? 'فاتح' : 'Light', icon: Sun },
    { id: 'dark', label: isRTL ? 'داكن' : 'Dark', icon: Moon },
    { id: 'system', label: isRTL ? 'النظام' : 'System', icon: Monitor },
  ]

  return (
    <Flex direction="column" gap="6">
      {/* Page Header */}
      <Box style={{ marginBottom: 'var(--space-2)' }}>
        <Heading 
          size="6" 
          weight="bold"
          style={{ 
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {t('title')}
        </Heading>
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {isRTL ? 'إدارة إعدادات حسابك وتفضيلات التطبيق' : 'Manage your account settings and preferences'}
        </Text>
      </Box>

      {/* Settings Content */}
      <Flex gap="6" direction={{ initial: 'column', md: 'row' }}>
        {/* Sidebar Navigation */}
        <nav 
          aria-label={isRTL ? 'إعدادات التنقل' : 'Settings navigation'}
          style={{
            width: '100%',
            maxWidth: '240px',
            flexShrink: 0,
          }}
        >
          <div 
            className="glass-card-static"
            style={{ padding: 'var(--space-2)' }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="focus-ring"
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    width: '100%',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--color-primary-500)' : 'transparent',
                    color: isActive ? 'var(--text-inverted)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'var(--transition-all)',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--surface-muted)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Main Content */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          {/* General Settings */}
          {activeTab === 'general' && (
            <Flex direction="column" gap="6" className="animate-fade-in">
              {/* Language Section */}
              <SettingsSection
                title={isRTL ? 'اللغة' : 'Language'}
                description={isRTL ? 'اختر لغة الواجهة المفضلة' : 'Choose your preferred interface language'}
              >
                <Flex gap="3" wrap="wrap">
                  {languages.map((lang) => (
                    <Link 
                      key={lang.code} 
                      href={`/${lang.code}/settings`}
                      style={{ textDecoration: 'none' }}
                    >
                      <OptionCard
                        isSelected={locale === lang.code}
                        label={lang.label}
                        sublabel={lang.nativeLabel}
                      />
                    </Link>
                  ))}
                </Flex>
              </SettingsSection>

              {/* Theme Section */}
              <SettingsSection
                title={isRTL ? 'المظهر' : 'Theme'}
                description={isRTL ? 'تخصيص مظهر الواجهة' : 'Customize the interface appearance'}
              >
                <Flex gap="3" wrap="wrap">
                  {themes.map((themeOption) => {
                    const Icon = themeOption.icon
                    return (
                      <button
                        key={themeOption.id}
                        onClick={() => setTheme(themeOption.id)}
                        className="focus-ring"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          padding: 'var(--space-4) var(--space-6)',
                          borderRadius: 'var(--radius-lg)',
                          border: theme === themeOption.id 
                            ? '2px solid var(--color-primary-500)' 
                            : '2px solid var(--border-default)',
                          background: theme === themeOption.id 
                            ? 'var(--color-primary-50)' 
                            : 'var(--surface-raised)',
                          cursor: 'pointer',
                          transition: 'var(--transition-all)',
                          minWidth: '100px',
                        }}
                      >
                        <Icon 
                          size={24} 
                          style={{ 
                            color: theme === themeOption.id 
                              ? 'var(--color-primary-600)' 
                              : 'var(--text-secondary)',
                          }} 
                        />
                        <Text 
                          size="2" 
                          weight={theme === themeOption.id ? 'bold' : 'medium'}
                          style={{ 
                            color: theme === themeOption.id 
                              ? 'var(--color-primary-700)' 
                              : 'var(--text-primary)',
                          }}
                        >
                          {themeOption.label}
                        </Text>
                      </button>
                    )
                  })}
                </Flex>
              </SettingsSection>
            </Flex>
          )}

          {/* CRM Integration */}
          {activeTab === 'crm' && (
            <Flex direction="column" gap="6" className="animate-fade-in">
              <SettingsSection
                title={isRTL ? 'ربط نظام CRM' : 'CRM Integration'}
                description={isRTL ? 'ربط نظام إدارة علاقات العملاء لدفع المناقصات تلقائياً' : 'Connect your CRM system to automatically push evaluated tenders'}
              >
                <Link 
                  href={`/${locale}/settings/crm`}
                  className="glass-card hover-lift"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-5)',
                    textDecoration: 'none',
                  }}
                >
                  <Flex align="center" gap="4">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                      }}
                    >
                      <Database size={24} color="white" />
                    </div>
                    <Box>
                      <Text 
                        size="3" 
                        weight="bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {isRTL ? 'إعداد اتصال CRM' : 'Configure CRM Connection'}
                      </Text>
                      <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                        {isRTL ? 'HubSpot, Salesforce, والمزيد' : 'HubSpot, Salesforce, and more'}
                      </Text>
                    </Box>
                  </Flex>
                  <ChevronRight 
                    size={20} 
                    style={{ color: 'var(--text-tertiary)' }}
                    className={isRTL ? 'flip-rtl' : ''}
                  />
                </Link>
              </SettingsSection>
            </Flex>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Flex direction="column" gap="6" className="animate-fade-in">
              <SettingsSection
                title={isRTL ? 'الإشعارات' : 'Notifications'}
                description={isRTL ? 'إدارة تفضيلات الإشعارات' : 'Manage your notification preferences'}
              >
                <Box 
                  className="glass-card-static"
                  style={{ 
                    padding: 'var(--space-6)',
                    textAlign: 'center',
                  }}
                >
                  <Bell 
                    size={48} 
                    style={{ 
                      color: 'var(--text-tertiary)',
                      marginBottom: 'var(--space-4)',
                    }} 
                  />
                  <Text 
                    size="3" 
                    weight="medium"
                    style={{ 
                      color: 'var(--text-primary)',
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {isRTL ? 'قريباً' : 'Coming Soon'}
                  </Text>
                  <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'إعدادات الإشعارات ستكون متاحة قريباً' : 'Notification settings will be available soon'}
                  </Text>
                </Box>
              </SettingsSection>
            </Flex>
          )}

          {/* Account */}
          {activeTab === 'account' && (
            <Flex direction="column" gap="6" className="animate-fade-in">
              <SettingsSection
                title={isRTL ? 'الحساب' : 'Account'}
                description={isRTL ? 'إدارة معلومات حسابك' : 'Manage your account information'}
              >
                <Box 
                  className="glass-card-static"
                  style={{ 
                    padding: 'var(--space-6)',
                    textAlign: 'center',
                  }}
                >
                  <User 
                    size={48} 
                    style={{ 
                      color: 'var(--text-tertiary)',
                      marginBottom: 'var(--space-4)',
                    }} 
                  />
                  <Text 
                    size="3" 
                    weight="medium"
                    style={{ 
                      color: 'var(--text-primary)',
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {isRTL ? 'قريباً' : 'Coming Soon'}
                  </Text>
                  <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                    {isRTL ? 'إعدادات الحساب ستكون متاحة قريباً' : 'Account settings will be available soon'}
                  </Text>
                </Box>
              </SettingsSection>
            </Flex>
          )}
        </Box>
      </Flex>
    </Flex>
  )
}

// Settings Section Component
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div 
      className="glass-card-static"
      style={{ padding: 'var(--space-6)' }}
    >
      <Box style={{ marginBottom: 'var(--space-5)' }}>
        <Text 
          size="4" 
          weight="bold"
          style={{ 
            color: 'var(--text-primary)',
            display: 'block',
            marginBottom: 'var(--space-1)',
          }}
        >
          {title}
        </Text>
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </Text>
      </Box>
      {children}
    </div>
  )
}

// Option Card Component
function OptionCard({
  isSelected,
  label,
  sublabel,
}: {
  isSelected: boolean
  label: string
  sublabel?: string
}) {
  return (
    <div
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        border: isSelected 
          ? '2px solid var(--color-primary-500)' 
          : '2px solid var(--border-default)',
        background: isSelected 
          ? 'var(--color-primary-50)' 
          : 'var(--surface-raised)',
        minWidth: '140px',
        cursor: 'pointer',
        transition: 'var(--transition-all)',
      }}
    >
      <Box>
        <Text 
          size="3" 
          weight={isSelected ? 'bold' : 'medium'}
          style={{ 
            color: isSelected ? 'var(--color-primary-700)' : 'var(--text-primary)',
            display: 'block',
          }}
        >
          {label}
        </Text>
        {sublabel && (
          <Text 
            size="1" 
            style={{ 
              color: isSelected ? 'var(--color-primary-600)' : 'var(--text-tertiary)',
            }}
          >
            {sublabel}
          </Text>
        )}
      </Box>
      {isSelected && (
        <Check 
          size={18} 
          style={{ 
            color: 'var(--color-primary-500)',
            flexShrink: 0,
          }} 
        />
      )}
    </div>
  )
}
