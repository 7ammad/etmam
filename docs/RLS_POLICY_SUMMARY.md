# RLS Policy Summary (Phase 8B)

Row Level Security policies for the Etmam app: authenticated users can read system tenders and read/write their own profile; anonymous cannot read tenders or profiles.

## System user (scraper)

- Tenders written by the scraper/sync API are owned by **system user** (`user_id = SYSTEM_USER_ID` from env).
- The system user UUID is stored in **`public.app_config`** (`key = 'system_user_id'`).
- **`public.get_system_user_id()`** (SECURITY DEFINER) returns that UUID for use in RLS.
- To match your `.env` value, run once in SQL Editor:
  ```sql
  UPDATE public.app_config SET value = '<your SYSTEM_USER_ID>' WHERE key = 'system_user_id';
  ```
- Default in migration: `00000000-0000-0000-0000-000000000001`.

## Tables and policies

| Table          | Who                    | SELECT | INSERT | UPDATE | DELETE |
|----------------|------------------------|--------|--------|--------|--------|
| **tenders**    | authenticated          | Own **or** system tenders | Own only | Own only | Own only |
| **evaluations**| authenticated          | Tender is own **or** system | Own tenders only | Own tenders only | Own tenders only |
| **crm_pushes** | authenticated          | Tender is own **or** system | Own tenders only | Own tenders only | Own tenders only |
| **profiles**   | authenticated          | Own only | Own only (or trigger) | Own only | — |
| **crm_configs**| authenticated          | Own only | Own only | Own only | Own only |
| **app_config** | —                      | No policies (definer/service only) | — | — | — |

- **Anonymous:** No access to tenders, evaluations, crm_pushes, profiles (no policies for `anon`).
- **Service role:** Bypasses RLS (used by sync API and server-side admin flows).

## Implementation details

- **Tenders SELECT:** `(auth.uid() = user_id) OR (user_id = get_system_user_id())`.
- **Evaluations / crm_pushes SELECT:** EXISTS on `tenders` where tender is own or system.
- **Profiles:** SELECT and UPDATE own row (`id = auth.uid()`); INSERT by trigger or own row (Phase 8A).
- RLS uses `(SELECT auth.uid())` and `(SELECT public.get_system_user_id())` so each is evaluated once per statement, not per row (migration 00009).

## Verification

- Logged-in user: dashboard loads; sees system tenders and own tenders.
- Anonymous: cannot read tenders or profiles (redirect to login or 401).
- Sync API (service role): can insert/update tenders as system user regardless of RLS.
