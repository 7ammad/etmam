import type { ReactNode } from 'react'
import { Theme } from '@radix-ui/themes'
import { ThemeProvider } from '@/components/providers/theme-provider'
import '@radix-ui/themes/styles.css'
import './globals.css'

type Props = {
  children: ReactNode
}

// Root layout must contain <html> and <body> tags
// Locale-specific attributes (lang, dir) are set by LocaleHtmlAttributes script
// Using system fonts for better compatibility - Google Fonts can be added via CSS link if needed
export default function RootLayout({ children }: Props) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Load Google Fonts via CSS link for better build compatibility */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..900&family=Noto+Kufi+Arabic:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased font-sans">
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
