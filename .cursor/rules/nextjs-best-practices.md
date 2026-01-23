# Next.js 16 Best Practices Skill
# Source: https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices

## Purpose
Ensure all Next.js code follows App Router best practices, Server Components patterns, and performance optimizations.

## Core Principles

### 1. Server Components by Default
- **Default to Server Components** - Only use `'use client'` when needed
- **When to use Client Components:**
  - Interactive elements (buttons, forms with state)
  - Browser APIs (localStorage, window)
  - React hooks (useState, useEffect)
  - Event handlers

### 2. Server Actions Pattern
```typescript
// ✅ CORRECT: Server Action
'use server'

export async function analyzeTender(tenderId: string) {
  // Server-side logic
  return { success: true, data: result }
}

// ❌ WRONG: API Route for mutations
export async function POST(req: Request) {
  // Use Server Actions instead
}
```

### 3. Data Fetching
```typescript
// ✅ CORRECT: Direct await in Server Component
export default async function Dashboard() {
  const tenders = await getTenders()
  return <TenderList tenders={tenders} />
}

// ❌ WRONG: useEffect in Client Component
'use client'
export default function Dashboard() {
  const [tenders, setTenders] = useState([])
  useEffect(() => {
    fetch('/api/tenders').then(...) // Don't do this
  }, [])
}
```

### 4. Type Safety
- Use Supabase generated types
- Define Zod schemas for Server Action inputs
- Use TypeScript strict mode

### 5. Error Handling
```typescript
// ✅ CORRECT: Result Pattern
export async function analyzeTender(data: TenderData) {
  try {
    const result = await ai.analyze(data)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### 6. Loading States
- Use `loading.tsx` for route-level loading
- Use Suspense boundaries for component-level loading
- Create RTL-aware skeleton components

### 7. Image Optimization
```typescript
// ✅ CORRECT
import Image from 'next/image'
<Image src="/logo.png" alt="Logo" width={200} height={200} />

// ❌ WRONG
<img src="/logo.png" alt="Logo" />
```

## App Router Structure
```
app/
  [locale]/
    layout.tsx          # Root layout (sets dir, lang)
    page.tsx            # Home page
    dashboard/
      layout.tsx        # Dashboard layout
      page.tsx          # Dashboard page
      loading.tsx       # Loading UI
      error.tsx         # Error boundary
    login/
      page.tsx          # Login page
```

## Middleware Pattern
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const locale = request.headers.get('accept-language')?.startsWith('ar') ? 'ar' : 'en'
  return NextResponse.redirect(new URL(`/${locale}${request.nextUrl.pathname}`, request.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## Performance Optimizations
1. **Use `next/dynamic` for heavy components**
2. **Implement route-level loading states**
3. **Use `React.cache()` for request deduplication**
4. **Optimize fonts** - Use `next/font` for IBM Plex Sans Arabic

## Common Mistakes to Avoid
- ❌ Using API Routes for mutations (use Server Actions)
- ❌ Fetching data in useEffect (use Server Components)
- ❌ Not handling loading/error states
- ❌ Hardcoding Arabic text (use next-intl)
- ❌ Not setting `dir` attribute in layout
