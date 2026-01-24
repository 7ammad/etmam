import { notFound } from 'next/navigation'
import { getTenderById } from '@/lib/queries/tender'
import { PushSuccessContent } from './push-success-content'

type Props = {
  params: Promise<{ locale: string; tenderId: string }>
}

export default async function PushSuccessPage({ params }: Props) {
  const { locale, tenderId } = await params
  const tender = await getTenderById(tenderId)

  if (!tender) {
    notFound()
  }

  return <PushSuccessContent locale={locale} tender={tender} />
}
