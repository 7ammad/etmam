# 10-Minute Demo Script — MVP Tender to Odoo Lead Import

## Demo objective

Show an end-to-end workflow:

1) Load tender dataset  
2) Score tenders 0–100 with reasons and recommendation  
3) Produce an Odoo-ready Excel import file in English  

**Note:** CLI pipeline (evaluate + export) needs no Supabase env. To show the app (login, dashboard), copy `.env.local.template` to `.env.local` and fill Supabase auth vars.

## Time plan

- 1 min: Problem + outcome  
- 2 min: Inputs and pipeline flow  
- 3 min: Run evaluation and show scored results  
- 3 min: Run export and show Excel output  
- 1 min: Next steps  
- (Optional: +1–2 min — run app, show login and protected dashboard)  

## Step-by-step demo

### 1) Show inputs

- Open scraper-output/ and show a tender JSON file exists.
- Explain that the system supports DB mode later, but today demo runs locally without credentials.

### 2) Run evaluation

Command:

- pnpm evaluate-tenders

Show output:

- data/tenders.scored.json
- Open the file and point to:
  - score value 0–100
  - recommendation
  - short reasons list

Mention:

- Scoring is editable via config/scoring.config.json.

### 3) Run Excel export

Command:

- pnpm export:odoo-excel

Show output:

- output/Odoo_Leads_Import.xlsx
- Open the workbook and show:
  - Sheet: Leads
  - Columns: Name, Customer, Expected Revenue, Closing Date, Description, Score, Recommendation, Tender Number, Source
  - Description includes Tender Number, Score, Recommendation, and reasons

### 4) Explain CRM integration path

- Today: Excel import into Odoo, no credentials needed.
- Later: Enable Odoo auto-push once they provide URL and auth.

### 5) Optional — show app (auth and protected dashboard)

- `pnpm dev` → open `http://localhost:3000/ar/login`
- Show login (requires Supabase env in `.env.local` from `.env.local.template`).
- After login, show protected dashboard; logged-out cannot access.

## Close

- Confirm reproducibility via:
  - pnpm type-check
  - pnpm verify:phase-1
  - pnpm verify:phase-2
