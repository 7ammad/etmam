# LibreTranslate (local translation in the repo)

LibreTranslate is an open-source, self-hosted translation service. It runs in the repo via Docker — no AI, no API key, no cloud cost.

## Quick start

1. **Start LibreTranslate** (from project root):

   ```bash
   docker compose -f docker-compose.libretranslate.yml up -d
   ```

   First run downloads Arabic and English models (~1–2 GB); later starts are fast. Only `ar` and `en` are loaded to reduce memory.

2. **Optional:** Set base URL if not using default:

   ```env
   LIBRE_TRANSLATE_URL=http://localhost:5000
   ```

   Default is `http://localhost:5000`. Use this if you run LibreTranslate on another host or port.

3. **Dashboard:** With the service running, the English dashboard list will translate entity/title (Arabic → English) via LibreTranslate. Results are cached in the DB (`phrase_translations`), so repeat loads and repeated phrases use the cache.

## If LibreTranslate is not running

The app still works: it uses the DB cache for previously translated phrases, then the static glossary ([`lib/entity-glossary.ts`](../../lib/entity-glossary.ts)) for known entities, then the original Arabic. No errors, no blocking.

## Files in the repo

| File | Purpose |
|------|--------|
| `docker-compose.libretranslate.yml` | Runs LibreTranslate with `ar,en` only; volume for model persistence |
| `lib/libre-translate.ts` | Calls local LibreTranslate API (single and batch) |
| `lib/translation-cache.ts` | DB cache (read/save); used before and after LibreTranslate |
| `components/dashboard/tenders-list-translated.tsx` | Uses cache + LibreTranslate for English list |

## References

- [LibreTranslate](https://libretranslate.com/) — open source, self-hosted
- [Installation (Docker)](https://docs.libretranslate.com/guides/installation/#with-docker)
- [API usage](https://docs.libretranslate.com/guides/api_usage/)
