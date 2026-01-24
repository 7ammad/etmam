import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

// Since we have a `[locale]` dynamic segment, this layout
// will be called for every locale-specific request
export default function RootLayout({ children }: Props) {
  return children
}
