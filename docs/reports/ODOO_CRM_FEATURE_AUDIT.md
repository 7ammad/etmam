# Odoo CRM Integration — Feature Audit Report

**Date:** 2026-02-02  
**Goal:** Determine whether Odoo CRM integration is starting from zero or built on existing scaffolding.

---

## 1. Dependency Check

**Source:** `package.json`

| Check | Result |
|-------|--------|
| Odoo-specific packages (`xmlrpc`, `odoo-xmlrpc`, etc.) | **None** |
| `axios` or other HTTP client for API calls | **None** (native `fetch` used) |
| Relevant packages present | `xlsx` (Excel export), `zod` (validation) |

**Conclusion:** No Odoo-specific npm packages. The app uses **native `fetch`** for Odoo JSON-RPC and **`xlsx`** for the Odoo Leads Excel export. No `xmlrpc` (Python-style) — Odoo is integrated via **JSON-RPC** over HTTP.

---

## 2. Environment Check

**Source:** `.env.example` and codebase grep for `process.env` + `ODOO_`

| Item | Result |
|------|--------|
| `.env.example` | **No Odoo variables** documented |
| Code-defined Odoo env vars | **Yes** — used only in `lib/crm/odoo-env.ts` |

**Odoo env vars used in code (not in `.env.example`):**

| Variable | Purpose |
|----------|---------|
| `ODOO_BASE_URL` | Odoo instance URL (e.g. `https://your-odoo.example.com`) |
| `ODOO_DB` | Database name |
| `ODOO_USERNAME` | Login username |
| `ODOO_PASSWORD` | Login password |
| `ODOO_PUSH_ENABLED` | `true` / `1` to allow push when using env credentials |

**Conclusion:** Odoo is **optional** and **server-only**. Env vars are read in `lib/crm/odoo-env.ts`; `.env.example` does **not** list them — you should add a short “Odoo (optional)” section to `.env.example` if you want them documented.

---

## 3. Codebase Scan

### 3.1 Search: "Odoo", "CRM", "xmlrpc", "integration"

- **Odoo / CRM:** Many hits in `types/`, `actions/`, `lib/crm/`, `components/`, `app/`, `messages/`, `docs/`.
- **xmlrpc:** No usage. Odoo is integrated via **JSON-RPC** (`/jsonrpc`), not XML-RPC.
- **integration:** Used for i18n (“Integrations”), classifier service type, and docs.

### 3.2 Key files (by role)

| Area | File(s) | Purpose |
|------|---------|---------|
| **Types** | `types/crm.ts` | CRM provider enum (`webhook`, `hubspot`, `salesforce`, `zoho`, **`odoo`**), config schemas (including `odooConfigSchema`, `odooEnvConfigSchema`), `OpportunityData`, `CRMProviderInterface`. |
| **Env** | `lib/crm/odoo-env.ts` | Reads `ODOO_BASE_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD`, `ODOO_PUSH_ENABLED`; exposes `getOdooConfigFromEnv()` and `isOdooPushEnabledFromEnv()`. |
| **Provider** | `lib/crm/providers/odoo.ts` | **Odoo CRM provider:** JSON-RPC (`common.authenticate`, `object.execute_kw`), `crm.lead` create, `opportunityToLeadFields()` for mapping. |
| **Factory** | `lib/crm/factory.ts` | Registers `OdooCRMProvider`; `getCRMProvider('odoo')` returns it. |
| **Server actions** | `actions/crm.ts` | Save/test connection, `getOdooStatus`, `getOdooConfigForForm`, `pushToCRMDryRun`, `pushToCRM`; resolves Odoo config from DB or env (`use_env`). |
| **Excel export** | `lib/export/odoo-excel.ts` | Builds Odoo Leads workbook (Name, Customer, Expected Revenue, Closing Date, etc.) from scored tenders + optional scraped map. |
| **API** | `app/api/export/odoo-excel/route.ts` | `GET /api/export/odoo-excel` — builds and downloads `Odoo_Leads_Import.xlsx`. |
| **Script** | `scripts/export-odoo-excel.ts` | CLI: loads scored JSON, builds workbook, writes `output/Odoo_Leads_Import.xlsx` (pnpm `export:odoo-excel`). |
| **UI – Settings** | `app/[locale]/settings/page.tsx`, `app/[locale]/settings/crm/page.tsx` | Settings page uses `getOdooConfigForForm` + `OdooIntegrationForm`; CRM page uses `getOdooStatus` + `CRMOdooCard`. |
| **UI – Forms/Cards** | `components/settings/odoo-integration-form.tsx`, `components/settings/crm-odoo-card.tsx` | Odoo URL/DB/username/password form; Test/Save; “Add Odoo (use env)” and status. |
| **UI – Dashboard** | `components/dashboard/push-to-crm-button.tsx`, `components/dashboard/export-odoo-card.tsx`, `components/dashboard/header-tools-strip.tsx` | Push to CRM (dry-run + real push); Export Odoo card; header “Export to CRM” → `/api/export/odoo-excel`. |
| **UI – Tender detail** | `components/dashboard/tender-detail-view.tsx` | Uses `PushToCRMButton` for single-tender push. |
| **i18n** | `messages/en.json`, `messages/ar.json` | Keys for CRM, Odoo, “Push to CRM”, “Export to Odoo Excel”, env status, form labels. |
| **DB** | `types/database.ts`, `supabase/migrations/00001_initial_schema.sql` (+ RLS in 00008, 00009) | Tables `crm_configs` (provider, config JSONB, incl. `odoo`), `crm_pushes` (tender_id, crm_config_id, status, external_id). |
| **E2E** | `tests/e2e/crm-push.spec.ts` | CRM settings page (Odoo section / login), “Test connection” / “Add Odoo”, tender detail push flow (mock; no real Odoo). |

---

## 4. Status Report Summary

### 4.1 What exists (scaffolding to reuse)

- **Odoo as a CRM provider:** Implemented in `lib/crm/providers/odoo.ts`:
  - JSON-RPC to `base_url/jsonrpc` (no xmlrpc).
  - `common.authenticate` for login.
  - `object.execute_kw` to create `crm.lead` with mapped fields (name, partner_name, expected_revenue, description, date_deadline).
- **Config sources:** Stored in DB (`crm_configs`) **or** server env (`ODOO_*` + `ODOO_PUSH_ENABLED`); `use_env` option for “credentials from server env”.
- **Server actions:** Full flow: save/test connection, Odoo status, form config, dry-run payload, and **push to CRM** with recording in `crm_pushes` and tender status update.
- **UI:** Settings (Odoo form + “Odoo from env” card), dashboard “Push to CRM” and “Export to CRM” (Excel), tender detail “Push to CRM”.
- **Excel export:** Odoo Leads-style workbook (script + API route), separate from live “Push to CRM” (which uses JSON-RPC).
- **Database:** `crm_configs` and `crm_pushes` with RLS; types in `types/database.ts` and `types/crm.ts`.
- **E2E:** CRM settings and push flow covered in mock mode (no real Odoo).

### 4.2 Gaps / notes

- **`.env.example`:** No Odoo section; add `ODOO_BASE_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD`, `ODOO_PUSH_ENABLED` if you want them documented.
- **No Odoo-specific npm packages:** By design; `fetch` + `xlsx` only.
- **xmlrpc:** Not used; integration is JSON-RPC only.

---

## 5. Conclusion

**You are not starting from zero.** There is substantial Odoo CRM scaffolding:

- **Live push to Odoo:** Implemented (JSON-RPC, `crm.lead` create, env or DB config, push recording).
- **Excel export for Odoo:** Implemented (script + API, separate from live push).
- **Settings and dashboard UI:** Implemented (Odoo form, env-based card, Push to CRM, Export to CRM).

**Recommendation:** Reuse the existing `lib/crm/` and `actions/crm.ts` flow. Add an “Odoo (optional)” block to `.env.example` for `ODOO_*` and `ODOO_PUSH_ENABLED` so deployers know what to set when using env-based Odoo.
