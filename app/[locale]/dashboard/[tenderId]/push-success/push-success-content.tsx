'use client'

export function PushSuccessContent({ locale, tender }: { locale: string; tender: any }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#22c55e' }}>Success!</h1>
      <p style={{ color: '#666' }}>Pushed to CRM - new design coming soon...</p>
    </div>
  )
}
