# 10-Minute Presentation Outline — MVP Tender Scoring to Odoo

## Slide 1 — Problem

- Teams need to quickly screen tenders and decide what to pursue.
- Manual review is slow and inconsistent.

## Slide 2 — MVP outcome

- Input: tender dataset
- Output: scored tenders 0–100 with reasons and recommendation
- Output: Odoo-ready Leads import file in English (Excel)

## Slide 3 — Architecture

- Scraper output JSON
- Evaluation engine reads config/scoring.config.json
- Produces data/tenders.scored.json
- Exporter creates output/Odoo_Leads_Import.xlsx

## Slide 4 — Scoring model

- Deterministic rules
- Editable thresholds and weights in config
- Produces short reasons for transparency

## Slide 5 — Odoo import format

- Sheet: Leads
- Columns: Name, Customer, Expected Revenue, Closing Date, Description, Score, Recommendation, Tender Number, Source
- Recommendation normalized to: Pursue, Monitor, Ignore

## Slide 6 — Demo and verification

- Commands:
  - pnpm evaluate-tenders
  - pnpm export:odoo-excel
- Quality gates:
  - pnpm type-check
  - pnpm verify:phase-1
  - pnpm verify:phase-2

## Slide 7 — Next steps

- When Odoo credentials are provided:
  - Enable auto-push provider
  - Keep Excel export as a fallback
