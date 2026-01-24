import { HomeContent } from '@/components/home-content'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  return <HomeContent locale={locale} />
}
