# Supabase PostgreSQL Best Practices Skill
# Source: https://skills.sh/supabase/agent-skills/supabase-postgres-best-practices

## Purpose
Ensure secure, performant database operations using Supabase with Row Level Security (RLS) and TypeScript type safety.

## Core Principles

### 1. Row Level Security (RLS) - MANDATORY
**Every table MUST have RLS enabled and policies defined.**

```sql
-- ✅ CORRECT: Enable RLS and create policies
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title_ar TEXT NOT NULL,
  reference_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenders
CREATE POLICY "Users can view own tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tenders
CREATE POLICY "Users can insert own tenders"
  ON tenders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 2. TypeScript Type Generation
```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

```typescript
// ✅ CORRECT: Use generated types
import { Database } from '@/types/supabase'

type Tender = Database['public']['Tables']['tenders']['Row']
type TenderInsert = Database['public']['Tables']['tenders']['Insert']
```

### 3. Server-Side Client Creation
```typescript
// ✅ CORRECT: Create typed client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### 4. Indexing Strategy
```sql
-- Index frequently queried columns
CREATE INDEX idx_tenders_user_id ON tenders(user_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_created_at ON tenders(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_tenders_user_status ON tenders(user_id, status);
```

### 5. Query Patterns
```typescript
// ✅ CORRECT: Typed query with error handling
export async function getTenders(userId: string) {
  const supabase = await getSupabaseClient()
  
  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}
```

### 6. Real-time Subscriptions (if needed)
```typescript
// ✅ CORRECT: Real-time with cleanup
'use client'

useEffect(() => {
  const channel = supabase
    .channel('tenders')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'tenders' },
      (payload) => {
        // Handle new tender
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Security Checklist
- [ ] RLS enabled on all tables
- [ ] Policies test `auth.uid()` for user isolation
- [ ] No sensitive data in client components
- [ ] Use environment variables for keys
- [ ] Validate inputs with Zod before DB operations

## Performance Checklist
- [ ] Indexes on foreign keys and frequently queried columns
- [ ] Use `select()` to limit returned columns
- [ ] Implement pagination for large datasets
- [ ] Use `order()` instead of sorting in application code

## Common Mistakes to Avoid
- ❌ Disabling RLS "for development" (never disable RLS)
- ❌ Using `supabaseClient` in Server Components (use SSR client)
- ❌ Not handling errors from Supabase queries
- ❌ Fetching all columns with `select('*')` when only need few
- ❌ Not indexing foreign keys
