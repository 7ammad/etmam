# Build fixes – official sources (MCP-fetched)

Reference for the fixes applied to clear build warnings. Sources: Next.js and Supabase official docs via MCP (Context7, Supabase search_docs).

---

## 1. Next.js: `experimental.turbo` invalid in Next.js 16

**Official (Next.js 16 upgrade / turbopack):**

- **Source:** Next.js 16 upgrade guide, [turbopack config](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack).
- **Fact:** The option was named `experimental.turbo` in Next.js 13.0.0–15.2.x. **In Next.js 16 it is removed.** Turbopack is configured with a **top-level `turbopack`** key in `next.config.ts`, not under `experimental`.
- **Official migration:**  
  `npx @next/codemod@latest next-experimental-turbo-to-turbopack .`
- **Next.js 16 config example:**
  ```ts
  const nextConfig: NextConfig = {
    turbopack: {
      // options, e.g. resolveAlias, resolveExtensions
    },
  }
  ```
- **What we did:** Our `next.config.ts` does not set `experimental.turbo`. A plugin (e.g. next-intl) may add it when merging config. We strip `experimental.turbo` from the final config so Next.js 16 does not warn. Codemod was run; it reported 0 files to change (no `experimental.turbo` in our code). The strip in `next.config.ts` is the workaround for plugin-injected `experimental.turbo`.

---

## 2. Translation cache: “URI too long” with `.in()` (Supabase)

**Official (Supabase):**

- **Source:** Supabase docs (Realtime Postgres changes, Storage batch usage).
- **Realtime:** The `in` filter has a **maximum of 100 values** (Realtime Postgres changes).
- **Pattern:** For large sets, **batch** requests (e.g. chunk keys into 50–100 per request), then merge results. Same idea as “Batch Process Large Datasets” in Supabase JS (e.g. 500 items per batch for storage-js).
- **What we did:** In `lib/translation-cache.ts`, `getCachedTranslations` and `getCachedSummaries` chunk the `.in('source_normalized', keys)` calls into **batches of 25** (conservative for long entity/title keys). This avoids URL length limits from PostgREST/HTTP. If “URI too long” persists, reduce batch size further (e.g. 15).

---

## 3. Missing table: `phrase_translations`

**Official (Supabase):**

- Create the table in the correct schema (`public`) with columns matching the app: `source_normalized`, `target_lang`, `translated_text`, plus `id`, `created_at`, and unique constraint on `(source_normalized, target_lang)`.
- Enable RLS and add policies as needed (see Supabase RLS docs).
- **What we did:** Migration `supabase/migrations/00013_phrase_translations.sql` defines the table. For projects where the table is missing, run `docs/supabase-phrase-translations-manual.sql` in the Supabase SQL Editor.

---

*Last updated from MCP-fetched Next.js and Supabase documentation.*
