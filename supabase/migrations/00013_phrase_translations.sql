-- Persistent cache for Arabic -> English (and future) phrase translations.
-- Key: normalized source text + target language. Only missing phrases hit the AI;
-- repeated phrases and page reloads read from DB (no AI).
-- Ref: dual-language sites with dynamic content — cache translation results in DB.

CREATE TABLE phrase_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_normalized TEXT NOT NULL,
  target_lang TEXT NOT NULL DEFAULT 'en',
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (source_normalized, target_lang)
);

CREATE INDEX idx_phrase_translations_lookup ON phrase_translations (source_normalized, target_lang);

COMMENT ON TABLE phrase_translations IS 'Cache for AI/API translations: source phrase (normalized) -> target_lang -> translated_text. Avoids re-translating on every page load.';
