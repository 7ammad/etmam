import { notFound } from 'next/navigation'
import { getTenderById } from '@/lib/queries/tender'

type Props = {
  params: Promise<{ locale: string; tenderId: string }>
}

export default async function TenderDetailPage({ params }: Props) {
  const { tenderId } = await params

  const tender = await getTenderById(tenderId)

  if (!tender) {
    notFound()
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{tender.title}</h1>
      <p style={{ color: '#666' }}>Tender detail page - new design coming soon...</p>
    </div>
  )
}
