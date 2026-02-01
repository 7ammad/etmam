/**
 * Adapt DB tender row to the shape expected by rule-based scoreTender (ScrapedTender).
 * Used by dashboard "Run analysis" when using config-driven evaluation.
 */

import type { Tables } from '@/types/database'
import type { ScrapedTender } from '@/types/scraper'

export function tenderRowToScraped(tender: Tables<'tenders'>): ScrapedTender {
  return {
    reference_no: tender.reference_no,
    title: tender.title,
    entity: tender.entity,
    deadline: tender.deadline,
    estimated_value: tender.estimated_value ?? null,
    booklet_price: tender.booklet_price_sar ?? null,
    initial_guarantee: tender.initial_guarantee_sar ?? null,
    description: tender.description ?? null,
    tab_sections: { basic_info: {} },
    source: 'etimad',
    scraped_at: new Date().toISOString(),
  }
}
