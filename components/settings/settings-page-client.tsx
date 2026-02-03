'use client'

import { useSearchParams } from 'next/navigation'
import type { Profile } from '@/lib/queries/profile'
import { SettingsShell, type SettingsSection } from './settings-shell'
import { ProfileSection } from './profile-section'
import { CRMSection } from './crm-section'
import { AppearanceSection } from './appearance-section'
import { DataExportSection } from './data-export-section'
import { AboutSection } from './about-section'

const SECTION_PARAM = 'section'
const VALID_SECTIONS: SettingsSection[] = ['profile', 'crm', 'appearance', 'export', 'about']

type OdooInitial = { base_url: string; db: string; username: string; hasPassword: boolean } | null

interface SettingsPageClientProps {
  locale: string
  profile: Profile | null
  userEmail: string | null
  odooInitial: OdooInitial
  version?: string
}

export function SettingsPageClient({
  locale,
  profile,
  userEmail,
  odooInitial,
  version = '0.1.0',
}: SettingsPageClientProps) {
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get(SECTION_PARAM)
  const section: SettingsSection = VALID_SECTIONS.includes(sectionParam as SettingsSection)
    ? (sectionParam as SettingsSection)
    : 'profile'

  return (
    <SettingsShell locale={locale} initialSection={section}>
      {section === 'profile' && (
        <ProfileSection profile={profile} userEmail={userEmail} />
      )}
      {section === 'crm' && (
        <CRMSection odooInitial={odooInitial} locale={locale} />
      )}
      {section === 'appearance' && (
        <AppearanceSection locale={locale} />
      )}
      {section === 'export' && (
        <DataExportSection locale={locale} />
      )}
      {section === 'about' && (
        <AboutSection version={version} />
      )}
    </SettingsShell>
  )
}
