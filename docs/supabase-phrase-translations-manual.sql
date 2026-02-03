-- Run this in Supabase SQL Editor if phrase_translations is missing or schema cache is stale.
-- Schema matches lib/translation-cache.ts and types/database.ts (source_normalized, target_lang, translated_text).
--
-- Where to run:
-- - Local: Supabase Studio → SQL Editor (http://127.0.0.1:54323 when supabase start is running). Paste this file and Run.
-- - Remote: Supabase Dashboard → your project → SQL Editor. Paste this file and Run.
-- - Alternative (local, wipes DB): pnpm supabase db reset (applies all migrations including 00013).

CREATE TABLE IF NOT EXISTS public.phrase_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_normalized TEXT NOT NULL,
  target_lang TEXT NOT NULL DEFAULT 'en',
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (source_normalized, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_phrase_translations_lookup
  ON public.phrase_translations (source_normalized, target_lang);

COMMENT ON TABLE public.phrase_translations IS
  'Cache for AI/API translations: source phrase (normalized) -> target_lang -> translated_text.';

ALTER TABLE public.phrase_translations ENABLE ROW LEVEL SECURITY;

-- Policies (adjust for your auth model; these allow service role and public read)
DROP POLICY IF EXISTS "Public read" ON public.phrase_translations;
CREATE POLICY "Public read" ON public.phrase_translations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role insert" ON public.phrase_translations;
CREATE POLICY "Service role insert" ON public.phrase_translations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role update" ON public.phrase_translations;
CREATE POLICY "Service role update" ON public.phrase_translations FOR UPDATE USING (true);
