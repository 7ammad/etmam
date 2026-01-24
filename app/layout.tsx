import type { ReactNode } from 'react'
import { Noto_Kufi_Arabic, Cairo } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import { ThemeProvider } from '@/components/providers/theme-provider'
import '@radix-ui/themes/styles.css'
import './globals.css'

// Noto Kufi Arabic - For Arabic text
const notoKufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-kufi',
  display: 'swap',
})

// Cairo - For English/Headings (Geometric style)
const cairo = Cairo({
  subsets: ['latin', 'arabic'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

type Props = {
  children: ReactNode
}

// Root layout must contain <html> and <body> tags
// Locale-specific attributes (lang, dir) are set by LocaleHtmlAttributes script
export default function RootLayout({ children }: Props) {
  return (
    <html className={`${notoKufi.variable} ${cairo.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Theme 
            accentColor="iris" 
            grayColor="slate" 
            panelBackground="translucent" 
            scaling="100%" 
            radius="large"
            appearance="inherit"
          >
            {children}
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  )
}
