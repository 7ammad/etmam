import { notFound } from 'next/navigation'
import { getTenderById } from '@/lib/queries/tender'
import { TenderDetailContent } from './tender-detail-content'

type Props = {
  params: Promise<{ locale: string; tenderId: string }>
}

export default async function TenderDetailPage({ params }: Props) {
  const { locale, tenderId } = await params

  const tender = await getTenderById(tenderId)

  if (!tender) {
    notFound()
  }

  return <TenderDetailContent locale={locale} tender={tender} />
}
