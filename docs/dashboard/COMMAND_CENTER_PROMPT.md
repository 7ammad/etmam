# Command Center — Rebuild Prompt

Use this prompt to implement the **Command Center** for scraping on the dashboard. The Command Center is a dedicated container for triggering and monitoring the Etimad scraper and related data actions.

---

## Placement

- **Where:** A new container on the dashboard, placed **directly under the KPI cards container** and **above the filters bar**.
- **Layout:** On the dashboard page, when the tenders list is shown, the order is:
  1. KPI row (`DashboardKpiRow` / `dashboard-kpi-section`)
  2. **Command center container** (new)
  3. Filters section (`filters-section-figma`)
  4. Tenders table

- **Visibility:** The command center is visible when there are tenders (i.e. when the list view is shown). Do not show it only in the empty state; it should sit under the KPIs whenever the user sees the list. Optionally it can also be shown in the empty state for consistency (same strip that currently shows when `tenders.length === 0` can be moved under a virtual KPI area or the command center can be the single place for scrape controls in both states—clarify with design if needed).

---

## Purpose

The Command Center lets users:

1. **Run the scraper** (active list from Etimad).
2. **Run the scraper in historical mode** (historical tenders).
3. **Stop** an in-progress scrape.
4. **Sync from last file** — sync tenders from the latest `scraper-output/run-*.json` into the DB (no browser scrape).
5. **Clear all tenders** — remove all tenders from the database (with a two-click confirm to avoid accidents).

---

## Functionality (Detailed)

### 1. Run scrape (active)

- **Action:** User clicks “Run scrape (active)”.
- **Backend:** `POST /api/scrape` (no body or `{}`). Starts the scraper as a child process.
- **If 409:** Scraper is already running → show “Scrape already in progress” and start polling status.
- **On success:** Start polling `GET /api/scrape` every 2 seconds. Show progress (e.g. 0–95% while running, 100% when completed). On `status: 'completed'` or `'failed'`, stop polling and refresh the page on completion.
- **Labels:** Use i18n key `scrape.runScrape` (e.g. “Run scrape (active)”). While running, show `scrape.running` (e.g. “Scraping…”).

### 2. Run scrape (historical)

- **Action:** User clicks “Run scrape (historical)”.
- **Backend:** `POST /api/scrape` with body `JSON.stringify({ historical: true })`.
- **Behavior:** Same as active (polling, progress, stop on completed/failed, refresh on completion). Use i18n key `scrape.runScrapeHistorical`.

### 3. Stop scraping

- **Visibility:** Show a “Stop scraping” button only when `status === 'running'`.
- **Action:** `POST /api/scrape/stop`. Stops the scraper child process.
- **After stop:** Set status to failed (or idle), stop polling, set progress to 0, refresh the page. Use `scrape.stopScraping` for label and `scrape.errorDetails` if showing error state.

### 4. Sync from last file

- **Action:** User clicks “Sync from last file”.
- **Backend:** `POST /api/scrape/sync-latest`. Reads the latest `scraper-output/run-*.json`, sends it to `POST /api/cron/sync` (with `CRON_SECRET`), and returns `{ upserted, errors }`. The sync route also runs the feed-translations step automatically.
- **UX:** Disable button while request is in flight; show “Syncing…” (`scrape.syncing`). On success, refresh the page and optionally show a short success message (e.g. “Done. X tenders synced.”). On error, show error message (e.g. from `data.error` or `data.errors?.[0]`).
- **Label:** `scrape.syncFromLastFile`.

### 5. Clear all tenders

- **Action:** Two-click confirm: first click shows “Click again to confirm” (`scrape.confirmClear`); second click performs clear.
- **Backend:** Call server action `clearAllTendersAction()` from `@/actions/tender` (or equivalent that deletes all tenders for the user/system).
- **UX:** Disable button while clearing; after success, refresh the page. Use `scrape.clearAll` and `scrape.confirmClear` for labels.

### 6. Status and progress

- **Initial load:** On mount, call `GET /api/scrape` once and set state to the returned `{ status, message?, tendersScraped?, upserted?, syncErrors?, error?, ... }`.
- **States:** `idle` | `running` | `completed` | `failed`.
- **Progress:** When `status === 'running'`, show a progress indicator (e.g. 0–95% with a small timer-based increment so it moves; when polling returns `completed`, set to 100%). When `status === 'failed'`, show 0% and an error state.
- **Polling:** While `status === 'running'`, poll `GET /api/scrape` every 2 s. When response is not `running`, stop polling and, if `completed`, call `router.refresh()`.

### 7. Error handling

- **Failed scrape:** Show “Error details” link/button that opens a dialog. Dialog shows `scrapeStatus.error` (or generic `scrape.failed`). Include a “Copy” button that copies the error text to the clipboard and shows “Copied!” briefly. Use `scrape.errorDetails`, `scrape.copyError`, `scrape.copied`, `scrape.close`.

---

## APIs and actions

| Action              | Method | Endpoint/import                    | Notes |
|---------------------|--------|------------------------------------|--------|
| Get status         | GET    | `/api/scrape`                      | Returns `{ status, message?, tendersScraped?, upserted?, error?, ... }`. |
| Start scrape       | POST   | `/api/scrape`                      | Body `{}` or `{ historical: true }`. 409 = already running. |
| Stop scrape        | POST   | `/api/scrape/stop`                 | Stops child process. |
| Sync from file     | POST   | `/api/scrape/sync-latest`          | Syncs latest run-*.json via cron sync + feed-translations. |
| Clear all tenders  | —      | `clearAllTendersAction` from `@/actions/tender` | Server action. |

---

## i18n namespace

Use the existing **`scrape`** namespace in `messages/en.json` and `messages/ar.json`. Keys used:

- `commandCenter`, `clearAll`, `confirmClear`
- `runScrape`, `runScrapeHistorical`, `running`, `stopScraping`, `starting`, `alreadyRunning`
- `syncFromLastFile`, `syncing`
- `done`, `doneScrapedSynced`, `savedTo`, `failed`, `errorDetails`, `copyError`, `copied`, `close`

Ensure all of these exist in both locales; add any missing keys.

---

## UI and styling

- **Container:** A distinct section (e.g. `<section aria-label="...">`) with a clear heading or title “Command center” (`scrape.commandCenter`). Style to match the rest of the dashboard: same card/surface style as the filters block (e.g. light container, border, border-radius). Use existing design tokens (`var(--surface-card)`, `var(--border-default)`, `var(--radius-card)`, etc.).
- **Layout:** Group primary actions (Run active, Run historical, Stop when running) together; place “Sync from last file” and “Clear all tenders” nearby (e.g. secondary row or same row). Show progress (e.g. percentage and/or progress bar) when status is `running`, `completed`, or `failed`.
- **Accessibility:** Use `aria-live="polite"` (or similar) for the progress/status area; label buttons with `aria-label` where needed; ensure error dialog is focusable and closable.

---

## Implementation notes

- **Component:** Can be a single client component (e.g. `CommandCenterCard` or `ScrapeCommandCenter`) that encapsulates all state (status, progress, confirm clear, error dialog, polling). It should receive `locale` if needed for i18n and use `useRouter()` for `router.refresh()` after sync/clear/complete.
- **Existing reference:** The current `ScrapeActionsCard` in `components/dashboard/scrape-actions-card.tsx` implements the same behavior but is only shown when `tenders.length === 0`. Reuse its logic (API calls, polling, clear action, sync-from-file, error dialog) and move or duplicate it into the new container under the KPI row; then either remove the old card from the empty-state strip or keep a minimal strip and use this container only when list is shown—depending on product preference.
- **Dashboard page / list client:** The KPI row is rendered inside `TendersListClient`. Add the new Command Center container immediately after `DashboardKpiRow` (and before the filters section) in the same component, so it appears under the KPI cards and above the filters bar.

---

## Summary checklist

- [ ] New container placed directly under the KPI cards, above the filters bar.
- [ ] Run scrape (active) → POST /api/scrape, then poll GET /api/scrape.
- [ ] Run scrape (historical) → POST /api/scrape with `{ historical: true }`, same polling.
- [ ] Stop scraping → POST /api/scrape/stop, only when status is running.
- [ ] Sync from last file → POST /api/scrape/sync-latest, refresh on success.
- [ ] Clear all tenders → two-click confirm, then clearAllTendersAction, refresh.
- [ ] Progress and status from GET /api/scrape; polling every 2 s while running.
- [ ] Error dialog with copy for failed scrape.
- [ ] All labels from `scrape` namespace (en + ar).
- [ ] Styling consistent with dashboard (card, tokens, accessibility).
