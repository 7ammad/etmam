# MVP Scope — Etimad Tender Evaluation to Odoo CRM Lead Import

## Goal
Ingest tenders from Etimad, evaluate each tender with a 0–100 score and short reasons, then generate Odoo-ready CRM lead records.

## MVP Inputs
- Etimad scraper output saved locally to file
- Optional: manual import from Excel or CSV is out of scope for today

## MVP Processing
- Normalize tender records to a stable schema
- Evaluate each tender:
  - Score: 0–100
  - Output: short reasons and a recommendation (Pursue, Monitor, Ignore)
  - Evaluation logic must be editable via a config file

## MVP Outputs
Primary output today
- Generate an English Excel workbook for Odoo import:
  - output/Odoo_Leads_Import.xlsx
  - Sheet: Leads

Optional output when credentials are available later
- Auto-push leads to Odoo via API
  - This is implemented as a provider scaffold and is disabled by default

Explanation of CRM workaround
- Odoo auto-push requires base URL and authentication details.
- Until provided, the MVP proves end-to-end workflow through an Odoo-ready Excel import file.

## Required fields in the lead export
- Name (tender title)
- Customer (entity)
- Closing Date (deadline)
- Expected Revenue (estimated value if available)
- Description (includes tender number, score, recommendation, reasons)
- Score
- Recommendation
- Tender Number
- Source

## Success criteria for demo
- Scrape to file produces tender records
- Evaluation produces scores 0–100 with reasons for each tender
- Excel export is generated and contains the required columns in English
- The runbook allows a reviewer to reproduce outputs with copy-paste commands
