Claude’s Plan
ETMAM Gap Patching Implementation Plan
Overview
Patch all gaps identified in the dashboard review, verify fixes, and run full tests.

Gaps Summary
Gap	Current State	Required Fix	Priority
1. CRM Push Button	Action exists, no UI	Add button to tender detail	High
2. Evaluation Sync	JSON file only, not in DB	Add sync API endpoint	High
3. Upload UI	Import action exists, no form	Add upload component	Medium
4. E2E Tests	Basic CRM tests only	Expand test coverage	Medium
Phase 1: CRM Push Button on Tender Detail Page
Files to Create
components/dashboard/push-to-crm-button.tsx - Client component with confirmation dialog
Files to Modify
app/[locale]/dashboard/[tenderId]/page.tsx - Add PushToCRMButton component
messages/en.json - Add new translation keys
messages/ar.json - Add Arabic translations
Component Design

PushToCRMButton
├── Props: tenderId, tenderTitle, hasEvaluation, currentStatus
├── States: idle | previewing | pushing | success | error
├── Features:
│   ├── Disabled when status='pushed' or no evaluation
│   ├── Shows preview via pushToCRMDryRun()
│   ├── Confirmation dialog before push
│   ├── Loading spinner during push
│   └── Success/error inline message
└── Pattern: Match CRMOdooCard component
New Translations

"crm": {
  "pushButton": "Push to CRM",
  "pushing": "Pushing...",
  "previewPayload": "Preview Opportunity",
  "alreadyPushed": "Already pushed to CRM",
  "noEvaluation": "Evaluate tender first"
}
Phase 2: Evaluation Sync API
Files to Create
app/api/sync/evaluations/route.ts - POST endpoint to sync scored tenders
scripts/sync-evaluations.ts - Script to call the API
API Design

POST /api/sync/evaluations
Authorization: Bearer <CRON_SECRET>
Body: {
  evaluations: ScoredTender[],
  source_file?: string,
  generated_at?: string
}
Response: {
  success: boolean,
  upserted: number,
  skipped: number,
  errors: string[]
}
Sync Logic
Receive scored tenders array
For each scored tender:
Lookup tender_id by reference_no in tenders table
Skip if tender not found (log warning)
Upsert to evaluations table with onConflict: 'tender_id'
Return counts and any errors
Package.json Script

"sync:evaluations": "tsx scripts/sync-evaluations.ts"
Phase 3: Upload UI Component
Files to Create
components/dashboard/upload-tender-form.tsx - Drag-and-drop file upload
Files to Modify
app/[locale]/dashboard/page.tsx - Add upload form to empty state
Component Design

UploadTenderForm
├── Props: onSuccess callback, locale
├── States: idle | dragover | uploading | success | error
├── Features:
│   ├── Drag-and-drop zone
│   ├── Click to select file
│   ├── File type validation (CSV, XLSX)
│   ├── Progress indicator
│   └── Result display (created count, errors)
└── Pattern: Match ExportOdooCard component
Phase 4: E2E Test Expansion
Files to Modify
tests/e2e/crm-push.spec.ts - Add tender detail page tests
New Test Cases

test.describe('CRM Push - Tender Detail', () => {
  test('push button visible when evaluated')
  test('push button disabled when already pushed')
  test('push button disabled when no evaluation')
  test('push shows confirmation dialog')
  test('push success updates status')
  test('push error shows message')
})

test.describe('Upload Flow', () => {
  test('upload form visible in empty state')
  test('upload accepts CSV file')
  test('upload accepts XLSX file')
  test('upload shows error for invalid file')
})
Execution Order

┌──────────────────────────────────────────────────────────────┐
│ Step 1: Create PushToCRMButton component                     │
│         → components/dashboard/push-to-crm-button.tsx        │
├──────────────────────────────────────────────────────────────┤
│ Step 2: Add translations (en + ar)                           │
│         → messages/en.json, messages/ar.json                 │
├──────────────────────────────────────────────────────────────┤
│ Step 3: Integrate button into tender detail page             │
│         → app/[locale]/dashboard/[tenderId]/page.tsx         │
├──────────────────────────────────────────────────────────────┤
│ Step 4: Create evaluation sync API                           │
│         → app/api/sync/evaluations/route.ts                  │
├──────────────────────────────────────────────────────────────┤
│ Step 5: Create sync script                                   │
│         → scripts/sync-evaluations.ts                        │
├──────────────────────────────────────────────────────────────┤
│ Step 6: Create upload form component                         │
│         → components/dashboard/upload-tender-form.tsx        │
├──────────────────────────────────────────────────────────────┤
│ Step 7: Integrate upload into dashboard                      │
│         → app/[locale]/dashboard/page.tsx                    │
├──────────────────────────────────────────────────────────────┤
│ Step 8: Expand E2E tests                                     │
│         → tests/e2e/crm-push.spec.ts                         │
├──────────────────────────────────────────────────────────────┤
│ Step 9: Run full test suite                                  │
│         → pnpm test                                          │
└──────────────────────────────────────────────────────────────┘
Verification Steps
Manual Testing
CRM Push: Navigate to tender detail → Click Push to CRM → Verify dialog → Confirm → Check status updates
Evaluation Sync: Run pnpm sync:evaluations → Check evaluations appear in DB
Upload: Go to empty dashboard → Drop CSV file → Verify tenders appear
Automated Testing

# Run all E2E tests
pnpm test

# Run specific test file
npx playwright test tests/e2e/crm-push.spec.ts

# Run with UI for debugging
pnpm test:ui
Expected Outcomes
 Push button appears on tender detail page
 Push creates opportunity in Odoo (or shows proper error)
 Tender status updates to 'pushed' after successful push
 Evaluations sync from JSON to database
 Upload form works with CSV and Excel files
 All 24+ E2E tests pass
Dependencies
Already Available
pushToCRM() action in actions/crm.ts
pushToCRMDryRun() action in actions/crm.ts
importTendersAction() action in actions/tender.ts
Radix UI components (Button, Dialog, Box, Flex, Text)
Lucide icons (Loader2, Send, Upload, CheckCircle)
i18n setup with useTranslations hook
Environment Variables Required
CRON_SECRET - For evaluation sync API auth
ODOO_* - For CRM push (already configured)
User approved the plan