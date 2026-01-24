# Implementation Plan
# Etmaam CRM Integration Tool - "علاقات العملاء"

**Timeline:** 30 Days (Competition Deadline)  
**Team Size:** 1-4 People  
**Methodology:** Stack-Agnostic AI Development Workflow

---

## Overview

This plan breaks down the PRD into executable daily/weekly tasks. The approach follows three phases:

1. **Phase 1 (Days 1-10):** Foundation + Data Engine
2. **Phase 2 (Days 11-20):** AI Evaluation + CRM Integration
3. **Phase 3 (Days 21-30):** Polish + Documentation + Testing

---

## Phase 0: Pre-Build Resolution ✅

### Task 0.1: Tech Stack Verification
**Status:** Complete  
**Output:** `.cursorrules` frozen

| Component | Version | Verified |
|-----------|---------|----------|
| Next.js | 16.1.4 | ✅ |
| TypeScript | 5.7+ | ✅ |
| Tailwind CSS | 4.0 | ✅ |
| Supabase | SSR Package | ✅ |
| Vercel AI SDK | 4.x | ✅ |

---

## Phase 1: Foundation & Data Engine (Days 1-10)

### Week 1: Project Setup + Core UI

---

### Day 1: Project Initialization

#### Task 1.1: Create Next.js 16 Project
**Files to Create:**
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `.env.local.example`
- `.gitignore`

**Implementation:**

```json
// package.json
{
  "name": "etmaam-crm",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.1.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next-intl": "^3.25.0",
    "next-themes": "^0.4.3",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.0",
    "ai": "^4.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "lucide-react": "^0.460.0",
    "zod": "^3.24.0",
    "date-fns": "^4.1.0",
    "papaparse": "^5.4.1",
    "xlsx": "^0.18.5",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/papaparse": "^5.3.15",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
```

```typescript
// next.config.ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default withNextIntl(nextConfig)
```

**Verification:**
- [ ] `pnpm install` succeeds
- [ ] `pnpm dev` starts on port 3000
- [ ] No TypeScript errors

---

#### Task 1.2: Configure Tailwind CSS v4 + RTL
**Files to Create:**
- `tailwind.config.ts`
- `app/globals.css`
- `postcss.config.mjs`

**Implementation:**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        background: {
          light: '#ffffff',
          dark: '#0f172a',
        },
      },
      fontFamily: {
        arabic: ['var(--font-ibm-plex-arabic)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

```css
/* app/globals.css */
@import 'tailwindcss';

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;
    --primary: 158.1 64.4% 41.6%;
    --primary-foreground: 0 0% 100%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 158.1 64.4% 51.6%;
    --primary-foreground: 222.2 84% 4.9%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-arabic;
  }

  /* RTL-specific styles */
  [dir="rtl"] {
    text-align: right;
  }

  [dir="rtl"] .icon-flip {
    transform: scaleX(-1);
  }
}
```

**Verification:**
- [ ] Tailwind classes apply correctly
- [ ] Dark mode toggle works
- [ ] RTL `dir` attribute respected

---

### Day 2: Internationalization + Layout

#### Task 1.3: Setup next-intl for Arabic/English
**Files to Create:**
- `i18n/config.ts`
- `i18n/request.ts`
- `messages/ar.json`
- `messages/en.json`
- `middleware.ts`

**Implementation:**

```typescript
// i18n/config.ts
export const locales = ['ar', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ar'
```

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { locales } from './config'

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) {
    return { messages: {} }
  }
  
  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

```json
// messages/ar.json
{
  "common": {
    "appName": "إتمام",
    "dashboard": "لوحة التحكم",
    "settings": "الإعدادات",
    "logout": "تسجيل الخروج",
    "login": "تسجيل الدخول"
  },
  "tender": {
    "title": "المنافسات",
    "addNew": "إضافة منافسة",
    "uploadFile": "رفع ملف",
    "entity": "الجهة",
    "referenceNo": "رقم المنافسة",
    "deadline": "الموعد النهائي",
    "estimatedValue": "القيمة التقديرية",
    "status": "الحالة"
  },
  "evaluation": {
    "title": "التقييم",
    "score": "الدرجة",
    "recommendation": "التوصية",
    "qualified": "مؤهل",
    "conditional": "مؤهل بشروط",
    "excluded": "مستبعد",
    "strengths": "نقاط القوة",
    "risks": "المخاطر",
    "summary": "الملخص"
  },
  "crm": {
    "title": "نظام علاقات العملاء",
    "connect": "ربط النظام",
    "createOpportunity": "إنشاء فرصة",
    "settings": "إعدادات CRM",
    "provider": "مزود الخدمة",
    "webhook": "رابط ويب",
    "apiKey": "مفتاح API",
    "testConnection": "اختبار الاتصال",
    "connectionSuccess": "تم الاتصال بنجاح",
    "connectionFailed": "فشل الاتصال"
  },
  "stats": {
    "totalTenders": "المنافسات",
    "qualified": "مؤهلة",
    "excluded": "مستبعدة",
    "totalValue": "القيمة الإجمالية"
  }
}
```

```json
// messages/en.json
{
  "common": {
    "appName": "Etmaam",
    "dashboard": "Dashboard",
    "settings": "Settings",
    "logout": "Logout",
    "login": "Login"
  },
  "tender": {
    "title": "Tenders",
    "addNew": "Add Tender",
    "uploadFile": "Upload File",
    "entity": "Entity",
    "referenceNo": "Reference No.",
    "deadline": "Deadline",
    "estimatedValue": "Estimated Value",
    "status": "Status"
  },
  "evaluation": {
    "title": "Evaluation",
    "score": "Score",
    "recommendation": "Recommendation",
    "qualified": "Qualified",
    "conditional": "Conditional",
    "excluded": "Excluded",
    "strengths": "Strengths",
    "risks": "Risks",
    "summary": "Summary"
  },
  "crm": {
    "title": "CRM",
    "connect": "Connect CRM",
    "createOpportunity": "Create Opportunity",
    "settings": "CRM Settings",
    "provider": "Provider",
    "webhook": "Webhook URL",
    "apiKey": "API Key",
    "testConnection": "Test Connection",
    "connectionSuccess": "Connection Successful",
    "connectionFailed": "Connection Failed"
  },
  "stats": {
    "totalTenders": "Tenders",
    "qualified": "Qualified",
    "excluded": "Excluded",
    "totalValue": "Total Value"
  }
}
```

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export const config = {
  matcher: ['/', '/(ar|en)/:path*'],
}
```

**Verification:**
- [ ] `/ar` shows Arabic content
- [ ] `/en` shows English content
- [ ] Middleware redirects `/` to `/ar`

---

#### Task 1.4: Create Root Layout with RTL + Theme
**Files to Create:**
- `app/[locale]/layout.tsx`
- `app/[locale]/page.tsx`
- `components/providers/theme-provider.tsx`

**Implementation:**

```typescript
// app/[locale]/layout.tsx
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { locales, type Locale } from '@/i18n/config'
import '@/app/globals.css'

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
})

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${ibmPlexArabic.variable} font-arabic antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

```typescript
// components/providers/theme-provider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Verification:**
- [ ] `dir="rtl"` set for Arabic
- [ ] IBM Plex Sans Arabic loads
- [ ] Theme toggles light/dark

---

### Day 3-4: Supabase Setup + Database Schema

#### Task 1.5: Setup Supabase Client
**Files to Create:**
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/middleware.ts`

**Implementation:**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

#### Task 1.6: Create Database Migrations
**Files to Create:**
- `supabase/migrations/001_initial_schema.sql`

**SQL:**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TENDERS TABLE
-- ============================================
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Source info
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('etimad', 'excel', 'csv', 'manual')),
  source_url TEXT,
  
  -- Tender data
  title_ar TEXT NOT NULL,
  title_en TEXT,
  entity_ar TEXT NOT NULL,
  entity_en TEXT,
  reference_no TEXT,
  description_ar TEXT,
  description_en TEXT,
  estimated_value DECIMAL(15,2),
  currency TEXT DEFAULT 'SAR',
  submission_deadline TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Just imported
    'evaluating',   -- AI processing
    'evaluated',    -- AI done
    'approved',     -- User approved
    'pushed',       -- Sent to CRM
    'rejected'      -- User rejected
  )),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_tenders_user_id ON tenders(user_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_deadline ON tenders(submission_deadline DESC);
CREATE INDEX idx_tenders_created ON tenders(created_at DESC);

-- RLS
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tenders"
  ON tenders FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- EVALUATIONS TABLE
-- ============================================
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- AI Evaluation
  score INTEGER CHECK (score >= 0 AND score <= 100),
  recommendation TEXT CHECK (recommendation IN ('qualified', 'conditional', 'excluded')),
  recommendation_ar TEXT,
  summary_ar TEXT NOT NULL,
  summary_en TEXT,
  
  -- Score breakdown
  budget_fit_score INTEGER DEFAULT 0,
  technical_fit_score INTEGER DEFAULT 0,
  timeline_fit_score INTEGER DEFAULT 0,
  strategic_fit_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  
  -- Lists as JSONB
  strengths JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  missing_requirements JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  model_version TEXT DEFAULT '1.0',
  confidence DECIMAL(3,2),
  raw_response JSONB,
  evaluated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_evaluations_tender ON evaluations(tender_id);
CREATE INDEX idx_evaluations_user ON evaluations(user_id);
CREATE INDEX idx_evaluations_score ON evaluations(score DESC);

-- RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own evaluations"
  ON evaluations FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CRM CONNECTIONS TABLE
-- ============================================
CREATE TABLE crm_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('webhook', 'hubspot', 'salesforce', 'zoho', 'odoo')),
  provider_name TEXT NOT NULL,
  
  -- Configuration (encrypted via Supabase)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  test_result TEXT CHECK (test_result IN ('success', 'failed', 'pending')),
  test_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, provider)
);

-- RLS
ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
  ON crm_connections FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CRM OPPORTUNITIES TABLE (Pushed Records)
-- ============================================
CREATE TABLE crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
  evaluation_id UUID REFERENCES evaluations(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  crm_connection_id UUID REFERENCES crm_connections(id) NOT NULL,
  
  -- CRM reference
  crm_id TEXT NOT NULL,
  crm_url TEXT,
  
  -- Sync status
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  sync_error TEXT,
  
  -- Data sent
  payload_sent JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_crm_opps_tender ON crm_opportunities(tender_id);
CREATE INDEX idx_crm_opps_user ON crm_opportunities(user_id);

-- RLS
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own opportunities"
  ON crm_opportunities FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenders_updated_at
  BEFORE UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_connections_updated_at
  BEFORE UPDATE ON crm_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Verification:**
- [ ] Migration runs successfully
- [ ] RLS enabled on all tables
- [ ] Indexes created

---

### Day 5-6: File Upload + Parser

#### Task 1.7: Build File Upload Component
**Files to Create:**
- `components/dashboard/file-uploader.tsx`
- `lib/utils/file-parser.ts`
- `types/tender.ts`

**Implementation:**

```typescript
// types/tender.ts
import { z } from 'zod'

export const TenderImportSchema = z.object({
  title_ar: z.string().min(1, 'العنوان مطلوب'),
  title_en: z.string().optional(),
  entity_ar: z.string().min(1, 'الجهة مطلوبة'),
  entity_en: z.string().optional(),
  reference_no: z.string().optional(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  estimated_value: z.number().positive().optional(),
  submission_deadline: z.string().optional(), // ISO date string
})

export type TenderImport = z.infer<typeof TenderImportSchema>

export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  mapping: z.record(z.string(), z.string()).optional(),
})
```

```typescript
// lib/utils/file-parser.ts
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { TenderImport, TenderImportSchema } from '@/types/tender'

export type ParseResult = {
  success: boolean
  data?: TenderImport[]
  errors?: string[]
  headers?: string[]
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  try {
    if (extension === 'csv') {
      return await parseCSV(file)
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      return await parseExcel(file)
    } else {
      return { success: false, errors: ['نوع الملف غير مدعوم'] }
    }
  } catch (error) {
    return { 
      success: false, 
      errors: [`خطأ في قراءة الملف: ${error instanceof Error ? error.message : 'Unknown'}`] 
    }
  }
}

async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      skipEmptyLines: true,
      complete: (results) => {
        const { data, headers } = mapToTenders(results.data as Record<string, any>[])
        resolve({ success: true, data, headers })
      },
      error: (error) => {
        resolve({ success: false, errors: [error.message] })
      },
    })
  })
}

async function parseExcel(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 }) // UTF-8
  
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(firstSheet) as Record<string, any>[]
  
  const { data, headers } = mapToTenders(rows)
  return { success: true, data, headers }
}

// Column name mapping (Arabic and English variants)
const COLUMN_MAPPINGS: Record<string, keyof TenderImport> = {
  // Arabic
  'العنوان': 'title_ar',
  'عنوان المنافسة': 'title_ar',
  'الجهة': 'entity_ar',
  'الجهة الحكومية': 'entity_ar',
  'رقم المنافسة': 'reference_no',
  'الرقم المرجعي': 'reference_no',
  'الوصف': 'description_ar',
  'القيمة': 'estimated_value',
  'القيمة التقديرية': 'estimated_value',
  'الموعد النهائي': 'submission_deadline',
  'تاريخ الإغلاق': 'submission_deadline',
  // English
  'title': 'title_ar',
  'tender_title': 'title_ar',
  'entity': 'entity_ar',
  'government_entity': 'entity_ar',
  'reference': 'reference_no',
  'reference_number': 'reference_no',
  'description': 'description_ar',
  'value': 'estimated_value',
  'estimated_value': 'estimated_value',
  'deadline': 'submission_deadline',
  'closing_date': 'submission_deadline',
}

function mapToTenders(rows: Record<string, any>[]): { data: TenderImport[], headers: string[] } {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  
  const data = rows.map((row) => {
    const mapped: Partial<TenderImport> = {}
    
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.toLowerCase().trim()
      const mappedField = COLUMN_MAPPINGS[key] || COLUMN_MAPPINGS[normalizedKey]
      
      if (mappedField) {
        if (mappedField === 'estimated_value') {
          // Parse numeric value
          const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
          if (!isNaN(numValue)) {
            mapped.estimated_value = numValue
          }
        } else {
          mapped[mappedField] = String(value).trim()
        }
      }
    }
    
    return mapped as TenderImport
  }).filter((tender) => {
    // Validate required fields
    const result = TenderImportSchema.safeParse(tender)
    return result.success
  })
  
  return { data, headers }
}
```

```typescript
// components/dashboard/file-uploader.tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { parseFile, type ParseResult } from '@/lib/utils/file-parser'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  onUpload: (data: ParseResult) => void
  isLoading?: boolean
}

export function FileUploader({ onUpload, isLoading }: FileUploaderProps) {
  const t = useTranslations('tender')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    const result = await parseFile(file)
    setParseResult(result)
    
    if (result.success) {
      onUpload(result)
    }
  }, [onUpload])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isLoading,
  })
  
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {isDragActive ? 'أفلت الملف هنا' : t('uploadFile')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              CSV, Excel (.xlsx, .xls)
            </p>
          </div>
        </div>
      </div>
      
      {parseResult && (
        <div className={cn(
          'p-4 rounded-lg flex items-start gap-3',
          parseResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
        )}>
          {parseResult.success ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  تم استيراد {parseResult.data?.length} منافسة
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  خطأ في الاستيراد
                </p>
                <ul className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {parseResult.errors?.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

**Verification:**
- [ ] Drag-and-drop works
- [ ] CSV parsing handles Arabic encoding
- [ ] Excel parsing works
- [ ] Validation errors display

---

### Day 7-8: Dashboard UI

#### Task 1.8: Build Dashboard Page
**Files to Create:**
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/dashboard/layout.tsx`
- `components/dashboard/stats-cards.tsx`
- `components/dashboard/tender-table.tsx`

**Implementation:**

```typescript
// app/[locale]/dashboard/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TenderTable } from '@/components/dashboard/tender-table'
import { FileUploader } from '@/components/dashboard/file-uploader'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const supabase = await createSupabaseServerClient()
  
  // Fetch tenders with evaluations
  const { data: tenders } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (
        id,
        score,
        recommendation,
        recommendation_ar,
        summary_ar
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)
  
  // Calculate stats
  const stats = {
    total: tenders?.length || 0,
    qualified: tenders?.filter(t => 
      t.evaluations?.[0]?.recommendation === 'qualified'
    ).length || 0,
    excluded: tenders?.filter(t => 
      t.evaluations?.[0]?.recommendation === 'excluded'
    ).length || 0,
    totalValue: tenders?.reduce((sum, t) => 
      sum + (Number(t.estimated_value) || 0), 0
    ) || 0,
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      
      <StatsCards stats={stats} />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TenderTable tenders={tenders || []} />
        </div>
        <div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">استيراد منافسات</h2>
            <FileUploader onUpload={() => {}} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

```typescript
// components/dashboard/stats-cards.tsx
'use client'

import { useTranslations } from 'next-intl'
import { FileText, CheckCircle, XCircle, Banknote } from 'lucide-react'

interface Stats {
  total: number
  qualified: number
  excluded: number
  totalValue: number
}

export function StatsCards({ stats }: { stats: Stats }) {
  const t = useTranslations('stats')
  
  const cards = [
    {
      label: t('totalTenders'),
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      label: t('qualified'),
      value: stats.qualified,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900',
    },
    {
      label: t('excluded'),
      value: stats.excluded,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-900',
    },
    {
      label: t('totalValue'),
      value: new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        notation: 'compact',
      }).format(stats.totalValue),
      icon: Banknote,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900',
    },
  ]
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border bg-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Verification:**
- [ ] Stats display correctly
- [ ] RTL layout works
- [ ] Dark mode styled properly

---

### Day 9-10: Tender CRUD Operations

#### Task 1.9: Create Server Actions for Tenders
**Files to Create:**
- `actions/tender-actions.ts`
- `components/tender/add-tender-dialog.tsx`

**Implementation:**

```typescript
// actions/tender-actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TenderImportSchema, TenderImport } from '@/types/tender'

// Result type for consistent error handling
type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

export async function createTender(
  data: TenderImport
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = TenderImportSchema.parse(data)
    const supabase = await createSupabaseServerClient()
    
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'غير مصرح' }
    }
    
    const { data: tender, error } = await supabase
      .from('tenders')
      .insert({
        user_id: user.user.id,
        source: 'manual',
        ...validated,
        submission_deadline: validated.submission_deadline 
          ? new Date(validated.submission_deadline).toISOString()
          : null,
      })
      .select('id')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/[locale]/dashboard', 'page')
    return { success: true, data: { id: tender.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

export async function importTenders(
  tenders: TenderImport[],
  source: 'excel' | 'csv'
): Promise<ActionResult<{ imported: number }>> {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'غير مصرح' }
    }
    
    const rows = tenders.map(t => ({
      user_id: user.user!.id,
      source,
      title_ar: t.title_ar,
      title_en: t.title_en,
      entity_ar: t.entity_ar,
      entity_en: t.entity_en,
      reference_no: t.reference_no,
      description_ar: t.description_ar,
      description_en: t.description_en,
      estimated_value: t.estimated_value,
      submission_deadline: t.submission_deadline
        ? new Date(t.submission_deadline).toISOString()
        : null,
    }))
    
    const { error, count } = await supabase
      .from('tenders')
      .insert(rows)
      .select()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/[locale]/dashboard', 'page')
    return { success: true, data: { imported: count || rows.length } }
  } catch (error) {
    return { success: false, error: 'حدث خطأ أثناء الاستيراد' }
  }
}

export async function deleteTender(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()
  
  const { error } = await supabase
    .from('tenders')
    .delete()
    .eq('id', id)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/[locale]/dashboard', 'page')
  return { success: true, data: undefined }
}

export async function getTenderById(id: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (*),
      crm_opportunities (*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    return { success: false as const, error: error.message }
  }
  
  return { success: true as const, data }
}
```

**Verification:**
- [ ] Create tender works
- [ ] Import multiple tenders works
- [ ] Delete tender works
- [ ] Data persists correctly

---

## Phase 2: AI Evaluation + CRM Integration (Days 11-20)

### Week 3: AI Evaluation Engine

---

### Day 11-12: AI Integration Setup

#### Task 2.1: Setup Vercel AI SDK
**Files to Create:**
- `lib/ai/client.ts`
- `lib/ai/prompts.ts`
- `lib/ai/evaluator.ts`

**Implementation:**

```typescript
// lib/ai/client.ts
import { createOpenAI } from '@ai-sdk/openai'

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const aiModel = openai('gpt-4o-mini')
```

```typescript
// lib/ai/prompts.ts
import type { Tender } from '@/types/tender'

export function buildEvaluationPrompt(tender: Tender, companyProfile?: CompanyProfile): string {
  return `أنت خبير تقييم منافسات حكومية سعودية. قم بتحليل هذه المنافسة وأعطني تقييماً شاملاً.

معلومات المنافسة:
- العنوان: ${tender.title_ar}
- الجهة: ${tender.entity_ar}
- القيمة التقديرية: ${tender.estimated_value ? `${tender.estimated_value.toLocaleString('ar-SA')} ريال` : 'غير محددة'}
- الموعد النهائي: ${tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleDateString('ar-SA') : 'غير محدد'}
- الوصف: ${tender.description_ar || 'غير متوفر'}
- رقم المنافسة: ${tender.reference_no || 'غير متوفر'}

${companyProfile ? `
ملف الشركة:
- التصنيف: ${companyProfile.classification || 'غير محدد'}
- الأنشطة: ${companyProfile.activities?.join('، ') || 'غير محددة'}
- الخبرات السابقة: ${companyProfile.experience || 'غير محددة'}
` : ''}

قم بإرجاع تقييمك بصيغة JSON فقط بدون أي نص إضافي:

{
  "score": <رقم من 0 إلى 100>,
  "recommendation": "qualified" | "conditional" | "excluded",
  "recommendation_ar": "مؤهل" | "مؤهل بشروط" | "مستبعد",
  "summary_ar": "<ملخص في 2-3 جمل>",
  "breakdown": {
    "budget_fit": <0-30>,
    "technical_fit": <0-25>,
    "timeline_fit": <0-20>,
    "strategic_fit": <0-15>,
    "risk_score": <0-10>
  },
  "strengths": ["<نقطة قوة 1>", "<نقطة قوة 2>"],
  "risks": ["<خطر 1>", "<خطر 2>"],
  "missing_requirements": ["<متطلب ناقص إن وجد>"],
  "action_items": ["<خطوة مقترحة 1>", "<خطوة مقترحة 2>"]
}`
}

interface CompanyProfile {
  classification?: string
  activities?: string[]
  experience?: string
}
```

```typescript
// lib/ai/evaluator.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { aiModel } from './client'
import { buildEvaluationPrompt } from './prompts'
import type { Tender } from '@/types/tender'

const EvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  recommendation: z.enum(['qualified', 'conditional', 'excluded']),
  recommendation_ar: z.string(),
  summary_ar: z.string(),
  breakdown: z.object({
    budget_fit: z.number().min(0).max(30),
    technical_fit: z.number().min(0).max(25),
    timeline_fit: z.number().min(0).max(20),
    strategic_fit: z.number().min(0).max(15),
    risk_score: z.number().min(0).max(10),
  }),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  missing_requirements: z.array(z.string()),
  action_items: z.array(z.string()),
})

export type EvaluationResult = z.infer<typeof EvaluationSchema>

export async function evaluateTender(tender: Tender): Promise<EvaluationResult> {
  const prompt = buildEvaluationPrompt(tender)
  
  const { object } = await generateObject({
    model: aiModel,
    schema: EvaluationSchema,
    prompt,
    temperature: 0.3, // More consistent outputs
  })
  
  return object
}
```

**Verification:**
- [ ] AI client initializes
- [ ] Prompt generates correctly
- [ ] Response parses to schema

---

### Day 13-14: Evaluation Actions + UI

#### Task 2.2: Create Evaluation Server Actions
**Files to Create:**
- `actions/evaluation-actions.ts`
- `components/tender/evaluation-display.tsx`

**Implementation:**

```typescript
// actions/evaluation-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { evaluateTender, type EvaluationResult } from '@/lib/ai/evaluator'

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

export async function runEvaluation(
  tenderId: string
): Promise<ActionResult<EvaluationResult>> {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'غير مصرح' }
    }
    
    // Update status to evaluating
    await supabase
      .from('tenders')
      .update({ status: 'evaluating' })
      .eq('id', tenderId)
    
    // Fetch tender
    const { data: tender, error: fetchError } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tenderId)
      .single()
    
    if (fetchError || !tender) {
      return { success: false, error: 'المنافسة غير موجودة' }
    }
    
    // Run AI evaluation
    const evaluation = await evaluateTender(tender)
    
    // Save evaluation
    const { error: insertError } = await supabase
      .from('evaluations')
      .insert({
        tender_id: tenderId,
        user_id: user.user.id,
        score: evaluation.score,
        recommendation: evaluation.recommendation,
        recommendation_ar: evaluation.recommendation_ar,
        summary_ar: evaluation.summary_ar,
        budget_fit_score: evaluation.breakdown.budget_fit,
        technical_fit_score: evaluation.breakdown.technical_fit,
        timeline_fit_score: evaluation.breakdown.timeline_fit,
        strategic_fit_score: evaluation.breakdown.strategic_fit,
        risk_score: evaluation.breakdown.risk_score,
        strengths: evaluation.strengths,
        risks: evaluation.risks,
        missing_requirements: evaluation.missing_requirements,
        action_items: evaluation.action_items,
        raw_response: evaluation,
      })
    
    if (insertError) {
      return { success: false, error: insertError.message }
    }
    
    // Update tender status
    await supabase
      .from('tenders')
      .update({ status: 'evaluated' })
      .eq('id', tenderId)
    
    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')
    
    return { success: true, data: evaluation }
  } catch (error) {
    console.error('Evaluation error:', error)
    return { success: false, error: 'فشل التقييم. يرجى المحاولة مرة أخرى.' }
  }
}

export async function evaluateAllPending(): Promise<ActionResult<{ processed: number }>> {
  const supabase = await createSupabaseServerClient()
  
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    return { success: false, error: 'غير مصرح' }
  }
  
  // Get pending tenders
  const { data: pendingTenders } = await supabase
    .from('tenders')
    .select('id')
    .eq('user_id', user.user.id)
    .eq('status', 'pending')
    .limit(10) // Process in batches
  
  if (!pendingTenders?.length) {
    return { success: true, data: { processed: 0 } }
  }
  
  let processed = 0
  for (const tender of pendingTenders) {
    const result = await runEvaluation(tender.id)
    if (result.success) processed++
  }
  
  return { success: true, data: { processed } }
}
```

```typescript
// components/tender/evaluation-display.tsx
'use client'

import { useTranslations } from 'next-intl'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  AlertCircle,
  ListChecks
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Evaluation {
  score: number
  recommendation: 'qualified' | 'conditional' | 'excluded'
  recommendation_ar: string
  summary_ar: string
  budget_fit_score: number
  technical_fit_score: number
  timeline_fit_score: number
  strategic_fit_score: number
  risk_score: number
  strengths: string[]
  risks: string[]
  missing_requirements: string[]
  action_items: string[]
}

interface Props {
  evaluation: Evaluation
}

export function EvaluationDisplay({ evaluation }: Props) {
  const t = useTranslations('evaluation')
  
  const recommendationStyles = {
    qualified: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-800 dark:text-green-200',
      icon: CheckCircle,
    },
    conditional: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-800 dark:text-amber-200',
      icon: AlertTriangle,
    },
    excluded: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-800 dark:text-red-200',
      icon: XCircle,
    },
  }
  
  const style = recommendationStyles[evaluation.recommendation]
  const Icon = style.icon
  
  const breakdownItems = [
    { label: 'الملاءمة المالية', score: evaluation.budget_fit_score, max: 30 },
    { label: 'التوافق الفني', score: evaluation.technical_fit_score, max: 25 },
    { label: 'الجدول الزمني', score: evaluation.timeline_fit_score, max: 20 },
    { label: 'التوافق الاستراتيجي', score: evaluation.strategic_fit_score, max: 15 },
    { label: 'تقييم المخاطر', score: evaluation.risk_score, max: 10 },
  ]
  
  return (
    <div className="space-y-6">
      {/* Score Circle */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(evaluation.score / 100) * 276.5} 276.5`}
              className={cn(
                evaluation.score >= 70 ? 'text-green-500' :
                evaluation.score >= 40 ? 'text-amber-500' : 'text-red-500'
              )}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{evaluation.score}</span>
          </div>
        </div>
        
        <div className={cn('px-4 py-2 rounded-lg flex items-center gap-2', style.bg)}>
          <Icon className={cn('w-5 h-5', style.text)} />
          <span className={cn('font-semibold', style.text)}>
            {evaluation.recommendation_ar}
          </span>
        </div>
      </div>
      
      {/* Summary */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {t('summary')}
        </h4>
        <p className="text-muted-foreground">{evaluation.summary_ar}</p>
      </div>
      
      {/* Score Breakdown */}
      <div className="space-y-3">
        <h4 className="font-semibold">تفصيل التقييم</h4>
        {breakdownItems.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">{item.score}/{item.max}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  (item.score / item.max) >= 0.7 ? 'bg-green-500' :
                  (item.score / item.max) >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${(item.score / item.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Strengths & Risks */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Strengths */}
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {t('strengths')}
          </h4>
          <ul className="space-y-1">
            {evaluation.strengths.map((item, i) => (
              <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Risks */}
        <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {t('risks')}
          </h4>
          <ul className="space-y-1">
            {evaluation.risks.map((item, i) => (
              <li key={i} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Action Items */}
      {evaluation.action_items.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            الخطوات المقترحة
          </h4>
          <ol className="list-decimal list-inside space-y-1">
            {evaluation.action_items.map((item, i) => (
              <li key={i} className="text-sm text-blue-700 dark:text-blue-300">
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
```

**Verification:**
- [ ] Evaluation runs successfully
- [ ] Results display correctly
- [ ] RTL layout works
- [ ] Score visualization accurate

---

### Day 15-17: CRM Integration Layer

#### Task 2.3: Build CRM Provider System
**Files to Create:**
- `lib/crm/types.ts`
- `lib/crm/factory.ts`
- `lib/crm/providers/webhook.ts`
- `lib/crm/providers/hubspot.ts`

**Implementation:**

```typescript
// lib/crm/types.ts
import { z } from 'zod'

export interface CRMProvider {
  id: string
  name: string
  nameAr: string
  
  connect(config: CRMConfig): Promise<ConnectionResult>
  testConnection(): Promise<TestResult>
  createOpportunity(data: OpportunityData): Promise<OpportunityResult>
}

export const CRMConfigSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('webhook'),
    webhookUrl: z.string().url(),
    apiKey: z.string().optional(),
    headers: z.record(z.string()).optional(),
  }),
  z.object({
    provider: z.literal('hubspot'),
    accessToken: z.string(),
    portalId: z.string().optional(),
  }),
  z.object({
    provider: z.literal('salesforce'),
    accessToken: z.string(),
    instanceUrl: z.string().url(),
  }),
])

export type CRMConfig = z.infer<typeof CRMConfigSchema>

export interface ConnectionResult {
  success: boolean
  error?: string
}

export interface TestResult {
  success: boolean
  message: string
  details?: Record<string, any>
}

export interface OpportunityData {
  tenderTitle: string
  tenderNumber: string
  entity: string
  estimatedValue: number
  deadline: Date
  qualificationScore: number
  recommendation: string
  riskLevel: 'low' | 'medium' | 'high'
  aiSummary: string
  sourceUrl?: string
}

export interface OpportunityResult {
  success: boolean
  crmId?: string
  crmUrl?: string
  error?: string
}
```

```typescript
// lib/crm/providers/webhook.ts
import type { CRMProvider, CRMConfig, OpportunityData, OpportunityResult, TestResult } from '../types'

export class WebhookCRMProvider implements CRMProvider {
  id = 'webhook'
  name = 'Webhook (Universal)'
  nameAr = 'رابط ويب (عام)'
  
  private config?: CRMConfig & { provider: 'webhook' }
  
  async connect(config: CRMConfig) {
    if (config.provider !== 'webhook') {
      return { success: false, error: 'Invalid provider type' }
    }
    this.config = config
    return { success: true }
  }
  
  async testConnection(): Promise<TestResult> {
    if (!this.config) {
      return { success: false, message: 'لم يتم تكوين الاتصال' }
    }
    
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          ...this.config.headers,
        },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      })
      
      if (response.ok) {
        return { success: true, message: 'تم الاتصال بنجاح' }
      } else {
        return { 
          success: false, 
          message: `فشل الاتصال: ${response.status} ${response.statusText}` 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        message: `خطأ في الاتصال: ${error instanceof Error ? error.message : 'Unknown'}` 
      }
    }
  }
  
  async createOpportunity(data: OpportunityData): Promise<OpportunityResult> {
    if (!this.config) {
      return { success: false, error: 'لم يتم تكوين الاتصال' }
    }
    
    try {
      const payload = {
        opportunity: {
          name: `${data.tenderTitle} - ${data.tenderNumber}`,
          company: data.entity,
          amount: data.estimatedValue,
          currency: 'SAR',
          close_date: data.deadline.toISOString(),
          stage: 'Qualification',
          custom_fields: {
            tender_number: data.tenderNumber,
            ai_score: data.qualificationScore,
            recommendation: data.recommendation,
            risk_level: data.riskLevel,
            ai_summary: data.aiSummary,
            source_url: data.sourceUrl,
          },
        },
        metadata: {
          source: 'etmaam',
          created_at: new Date().toISOString(),
        },
      }
      
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          ...this.config.headers,
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `فشل الإرسال: ${errorText}` }
      }
      
      const result = await response.json().catch(() => ({}))
      
      return {
        success: true,
        crmId: result.id || `webhook-${Date.now()}`,
        crmUrl: result.url,
      }
    } catch (error) {
      return { 
        success: false, 
        error: `خطأ: ${error instanceof Error ? error.message : 'Unknown'}` 
      }
    }
  }
}
```

```typescript
// lib/crm/factory.ts
import type { CRMProvider } from './types'
import { WebhookCRMProvider } from './providers/webhook'
// import { HubSpotCRMProvider } from './providers/hubspot'
// import { SalesforceCRMProvider } from './providers/salesforce'

const providers: Map<string, CRMProvider> = new Map([
  ['webhook', new WebhookCRMProvider()],
  // ['hubspot', new HubSpotCRMProvider()],
  // ['salesforce', new SalesforceCRMProvider()],
])

export function getCRMProvider(id: string): CRMProvider | undefined {
  return providers.get(id)
}

export function listCRMProviders(): { id: string; name: string; nameAr: string }[] {
  return Array.from(providers.values()).map(p => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
  }))
}
```

**Verification:**
- [ ] Webhook provider works
- [ ] Connection test works
- [ ] Opportunity creation works

---

### Day 18-20: CRM UI + Server Actions

#### Task 2.4: Build CRM Settings Page
**Files to Create:**
- `app/[locale]/settings/crm/page.tsx`
- `components/settings/crm-config-form.tsx`
- `actions/crm-actions.ts`

**Implementation:**

```typescript
// actions/crm-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCRMProvider } from '@/lib/crm/factory'
import { CRMConfigSchema, type CRMConfig, type OpportunityData } from '@/lib/crm/types'

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

export async function saveCRMConnection(
  config: CRMConfig
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = CRMConfigSchema.parse(config)
    const supabase = await createSupabaseServerClient()
    
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'غير مصرح' }
    }
    
    const provider = getCRMProvider(validated.provider)
    if (!provider) {
      return { success: false, error: 'مزود غير مدعوم' }
    }
    
    // Upsert connection
    const { data, error } = await supabase
      .from('crm_connections')
      .upsert({
        user_id: user.user.id,
        provider: validated.provider,
        provider_name: provider.nameAr,
        config: validated,
        is_active: true,
      }, {
        onConflict: 'user_id,provider',
      })
      .select('id')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/[locale]/settings/crm', 'page')
    return { success: true, data: { id: data.id } }
  } catch (error) {
    return { success: false, error: 'حدث خطأ في الحفظ' }
  }
}

export async function testCRMConnection(
  connectionId: string
): Promise<ActionResult<{ message: string }>> {
  const supabase = await createSupabaseServerClient()
  
  const { data: connection, error } = await supabase
    .from('crm_connections')
    .select('*')
    .eq('id', connectionId)
    .single()
  
  if (error || !connection) {
    return { success: false, error: 'الاتصال غير موجود' }
  }
  
  const provider = getCRMProvider(connection.provider)
  if (!provider) {
    return { success: false, error: 'مزود غير مدعوم' }
  }
  
  await provider.connect(connection.config as CRMConfig)
  const result = await provider.testConnection()
  
  // Update test result
  await supabase
    .from('crm_connections')
    .update({
      last_tested_at: new Date().toISOString(),
      test_result: result.success ? 'success' : 'failed',
      test_error: result.success ? null : result.message,
    })
    .eq('id', connectionId)
  
  revalidatePath('/[locale]/settings/crm', 'page')
  
  if (result.success) {
    return { success: true, data: { message: result.message } }
  } else {
    return { success: false, error: result.message }
  }
}

export async function pushToCRM(
  tenderId: string
): Promise<ActionResult<{ crmUrl?: string }>> {
  const supabase = await createSupabaseServerClient()
  
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    return { success: false, error: 'غير مصرح' }
  }
  
  // Get active CRM connection
  const { data: connection } = await supabase
    .from('crm_connections')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('is_active', true)
    .single()
  
  if (!connection) {
    return { success: false, error: 'لا يوجد اتصال CRM فعال. يرجى إعداد الاتصال أولاً.' }
  }
  
  // Get tender with evaluation
  const { data: tender } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (*)
    `)
    .eq('id', tenderId)
    .single()
  
  if (!tender) {
    return { success: false, error: 'المنافسة غير موجودة' }
  }
  
  const evaluation = tender.evaluations?.[0]
  
  // Prepare opportunity data
  const opportunityData: OpportunityData = {
    tenderTitle: tender.title_ar,
    tenderNumber: tender.reference_no || tender.id.slice(0, 8),
    entity: tender.entity_ar,
    estimatedValue: Number(tender.estimated_value) || 0,
    deadline: new Date(tender.submission_deadline || Date.now() + 30 * 24 * 60 * 60 * 1000),
    qualificationScore: evaluation?.score || 0,
    recommendation: evaluation?.recommendation_ar || 'غير مقيم',
    riskLevel: evaluation?.score ? (
      evaluation.score >= 70 ? 'low' :
      evaluation.score >= 40 ? 'medium' : 'high'
    ) : 'medium',
    aiSummary: evaluation?.summary_ar || '',
    sourceUrl: tender.source_url,
  }
  
  // Get provider and push
  const provider = getCRMProvider(connection.provider)
  if (!provider) {
    return { success: false, error: 'مزود غير مدعوم' }
  }
  
  await provider.connect(connection.config as CRMConfig)
  const result = await provider.createOpportunity(opportunityData)
  
  if (!result.success) {
    return { success: false, error: result.error || 'فشل الإنشاء' }
  }
  
  // Save opportunity record
  await supabase
    .from('crm_opportunities')
    .insert({
      tender_id: tenderId,
      evaluation_id: evaluation?.id,
      user_id: user.user.id,
      crm_connection_id: connection.id,
      crm_id: result.crmId!,
      crm_url: result.crmUrl,
      payload_sent: opportunityData,
    })
  
  // Update tender status
  await supabase
    .from('tenders')
    .update({ status: 'pushed' })
    .eq('id', tenderId)
  
  revalidatePath('/[locale]/dashboard', 'page')
  revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')
  
  return { success: true, data: { crmUrl: result.crmUrl } }
}
```

**Verification:**
- [ ] Save CRM settings works
- [ ] Test connection works
- [ ] Push to CRM creates opportunity
- [ ] Status updates correctly

---

## Phase 3: Polish + Documentation (Days 21-30)

### Week 4-5: Testing, Polish, Documentation

---

### Day 21-23: E2E Testing + Bug Fixes

#### Task 3.1: Manual E2E Test Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Upload Excel** | 1. Login → 2. Dashboard → 3. Drop Excel file | Tenders imported |
| **AI Evaluation** | 1. Select tender → 2. Click "تقييم" | Score + recommendation shown |
| **CRM Setup** | 1. Settings → 2. CRM → 3. Enter webhook URL → 4. Test | "تم الاتصال بنجاح" |
| **Push to CRM** | 1. Evaluated tender → 2. Click "إنشاء فرصة" | Success + CRM link |

---

### Day 24-25: UI Polish + RTL Fixes

#### Task 3.2: RTL Verification Checklist

- [ ] All icons flip correctly (arrows, chevrons)
- [ ] Progress bars fill from right
- [ ] Date pickers show Arabic format
- [ ] Number formatting uses Arabic locale
- [ ] Tables scroll correctly
- [ ] Modals align properly
- [ ] Toast notifications position correctly

---

### Day 26-27: Documentation

#### Task 3.3: Create README + Setup Guide
**Files to Create:**
- `README.md`
- `docs/SETUP.md`
- `docs/API.md`

---

### Day 28-30: Final Testing + Demo

#### Task 3.4: Competition Submission Checklist

- [ ] E2E flow works: Upload → Evaluate → CRM Push
- [ ] All Arabic translations complete
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Error handling graceful
- [ ] Loading states smooth
- [ ] Documentation complete
- [ ] Demo video recorded
- [ ] Code clean and commented

---

## Success Metrics

### Competition Requirements ✓

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| سير إجراءات يعمل | E2E flow complete | ⬜ |
| سهولة التشغيل | Clean UI, Arabic-first | ⬜ |
| منطق تقييم قابل للتعديل | AI prompts configurable | ⬜ |
| توثيق واضح | README + Video | ⬜ |
| حماية بيانات الدخول | Supabase encryption | ⬜ |

### Technical Quality ✓

| Metric | Target | Status |
|--------|--------|--------|
| TypeScript strict | 0 errors | ⬜ |
| RTL layout | 100% correct | ⬜ |
| Dark mode | Fully themed | ⬜ |
| Mobile responsive | 100% | ⬜ |
| Page load | < 3 seconds | ⬜ |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI rate limits | Medium | High | Implement retry + caching |
| CRM API changes | Low | Medium | Abstract via provider interface |
| Supabase downtime | Low | High | Error handling + offline mode |
| Arabic encoding issues | Medium | Medium | UTF-8 BOM handling |

---

## Post-Competition Roadmap

### Month 2: Public Beta
- Additional CRM providers (Zoho, Odoo)
- User registration flow
- Pricing tiers

### Month 3: Scale
- Etimad API integration
- Team collaboration
- WhatsApp notifications

### Month 4+: Enterprise
- SSO + RBAC
- Custom CRM mappings
- White-label option

---

**Implementation Plan End**

*Follow this plan sequentially for best results. Each task builds on the previous one.*
