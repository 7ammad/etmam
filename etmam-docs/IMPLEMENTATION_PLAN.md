# Etmaam Implementation Plan
# Based on Stack-Agnostic AI Development Workflow

## Overview
This plan breaks down the Etmaam MVP into executable tasks following the Stack-Agnostic workflow principles. Each phase builds on the previous one, with clear dependencies and verification steps.

## Phase 0: Resolution & Context Bridge ✅
**Status:** Complete
- [x] Tech stack selected and frozen
- [x] `.cursorrules` file created
- [x] Skills installed in `.cursor/rules/`
- [x] Project structure defined

## Phase 1: Foundation & "Arabic First" Setup (Days 1-5)

### Goal
A working "Shell" that handles RTL/LTR and Dark Mode perfectly.

### Task 1.1: Initialize Next.js 16 Project
**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `.env.local` (template)

**Implementation:**
```json
// package.json
{
  "name": "etmaam",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "16.1.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

**Verification:**
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts server on port 3000
- [ ] TypeScript compiles without errors

**Dependencies:** None

---

### Task 1.2: Configure Tailwind CSS v4 with RTL Support
**Files:**
- Create: `tailwind.config.ts`
- Create: `app/globals.css`
- Modify: `next.config.ts`

**Implementation:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Emerald green accents (Saudi flag inspired)
        primary: {
          DEFAULT: '#10b981', // emerald-500
          dark: '#059669', // emerald-600
        },
      },
    },
  },
  plugins: [],
}
export default config
```

**Verification:**
- [ ] RTL logical classes work (`ms-4`, `me-2`, `start-0`, `end-auto`)
- [ ] Dark mode classes apply correctly
- [ ] Tailwind styles compile

**Dependencies:** Task 1.1

---

### Task 1.3: Setup next-intl for i18n
**Files:**
- Create: `i18n/request.ts`
- Create: `i18n/config.ts`
- Create: `messages/ar.json`
- Create: `messages/en.json`
- Create: `middleware.ts`

**Implementation:**
```typescript
// i18n/config.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default
}))
```

**Verification:**
- [ ] `/ar` route shows Arabic content
- [ ] `/en` route shows English content
- [ ] Middleware redirects correctly
- [ ] Default locale is Arabic

**Dependencies:** Task 1.1

---

### Task 1.4: Create Root Layout with RTL Support
**Files:**
- Create: `app/[locale]/layout.tsx`
- Create: `app/[locale]/page.tsx`

**Implementation:**
```typescript
// app/[locale]/layout.tsx
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
})

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!['ar', 'en'].includes(locale)) {
    notFound()
  }

  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body className={ibmPlexArabic.variable}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

**Verification:**
- [ ] `dir="rtl"` set correctly for Arabic
- [ ] `dir="ltr"` set correctly for English
- [ ] Font loads correctly
- [ ] Layout renders without errors

**Dependencies:** Task 1.2, Task 1.3

---

### Task 1.5: Implement Theme Toggle (Light/Dark)
**Files:**
- Create: `components/ui/theme-toggle.tsx`
- Create: `components/providers/theme-provider.tsx`
- Modify: `app/[locale]/layout.tsx`

**Implementation:**
```typescript
// components/providers/theme-provider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Verification:**
- [ ] Theme persists across page reloads
- [ ] System preference detection works
- [ ] Manual toggle switches themes
- [ ] Dark mode styles apply correctly
- [ ] RTL layout preserved in both themes

**Dependencies:** Task 1.4

---

## Phase 2: The Data Engine (Days 6-12)

### Goal
Upload CSV/Excel, Parse, Store in Supabase with proper Arabic encoding handling.

### Task 2.1: Setup Supabase Client & Types
**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `types/supabase.ts` (generated)

**Implementation:**
[See supabase-postgres-best-practices skill]

**Verification:**
- [ ] Server client works in Server Components
- [ ] Client client works in Client Components
- [ ] Types generated from Supabase schema
- [ ] RLS policies configured

**Dependencies:** Phase 1 complete

---

### Task 2.2: Create Tenders Table Schema
**Files:**
- Create: `supabase/migrations/001_create_tenders.sql`

**Implementation:**
```sql
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  reference_no TEXT,
  status TEXT DEFAULT 'pending',
  ai_qualification_score INTEGER,
  ai_summary_ar TEXT,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  original_source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tenders"
  ON tenders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

**Verification:**
- [ ] Table created successfully
- [ ] RLS enabled
- [ ] Policies work correctly
- [ ] Indexes created for performance

**Dependencies:** Task 2.1

---

### Task 2.3: Build File Upload Component
**Files:**
- Create: `components/ui/file-uploader.tsx`
- Create: `lib/utils/file-parser.ts`

**Implementation:**
[Complete drag-and-drop component with CSV/Excel parsing]

**Verification:**
- [ ] Drag-and-drop works
- [ ] File validation (type, size)
- [ ] Arabic encoding handled correctly (UTF-8 with BOM)
- [ ] Error messages in Arabic/English based on locale

**Dependencies:** Task 2.2

---

## Phase 3: The AI Analyst (Days 13-20)

### Goal
The "Brain" that scores tenders and provides Arabic summaries.

### Task 3.1: Setup Vercel AI SDK
**Files:**
- Create: `lib/ai/client.ts`
- Create: `actions/analyze-tender.ts`

**Implementation:**
[Server Action that calls AI API and returns structured JSON]

**Verification:**
- [ ] AI responses stream correctly
- [ ] JSON parsing works
- [ ] Error handling robust
- [ ] Responses in Arabic for Arabic locale

**Dependencies:** Phase 2 complete

---

## Phase 4: The A2UI Dynamic View (Days 21-27)

### Goal
The "Detail Panel" with dynamic UI rendering from AI JSON.

### Task 4.1: Create DynamicRenderer Component
**Files:**
- Create: `components/a2ui/dynamic-renderer.tsx`
- Create: `components/a2ui/renderers/alert-renderer.tsx`
- Create: `components/a2ui/renderers/stats-renderer.tsx`

**Implementation:**
[Component that maps JSON UI structure to Shadcn components]

**Verification:**
- [ ] JSON -> Component mapping works
- [ ] RTL layout preserved
- [ ] Dark mode styles apply
- [ ] All UI types render correctly

**Dependencies:** Phase 3 complete

---

## Phase 5: Polish & CRM Push (Days 28-30)

### Goal
The "Win" moment - polished UI with CRM integration.

### Task 5.1: Add Confetti Animation
**Files:**
- Create: `components/ui/confetti.tsx`

**Verification:**
- [ ] Animation triggers on approval
- [ ] RTL-aware animation direction
- [ ] Performance optimized

**Dependencies:** Phase 4 complete

---

## Success Metrics

### Technical
- [ ] TypeScript strict mode: No errors
- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] RTL layout perfect in both themes

### User Experience
- [ ] Arabic text renders correctly
- [ ] Dark mode usable (WCAG AA contrast)
- [ ] Loading states smooth
- [ ] Error messages helpful

### Business
- [ ] AI correctly identifies qualified tenders
- [ ] CRM push works
- [ ] File upload handles Arabic data
- [ ] Dashboard loads < 2 seconds
