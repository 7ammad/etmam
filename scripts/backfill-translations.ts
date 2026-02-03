#!/usr/bin/env tsx
/**
 * Backfill Translations Script
 *
 * Populates entity_en and title_en columns for existing tenders that don't have them.
 * Uses AI summarization (same as sync API) to generate English translations.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-translations.ts [--dry-run] [--batch-size=50]
 *
 * Options:
 *   --dry-run       Show what would be translated without making changes
 *   --batch-size=N  Process N tenders per batch (default: 50)
 *
 * Prerequisites:
 *   - AI must be configured (DEEPSEEK_API_KEY or OPENAI_API_KEY)
 *   - Database must be accessible (local Supabase or remote)
 */

import { createServiceClient } from '../lib/supabase/server'
import { summarizeEntitiesBatch, summarizeTitlesBatch } from '../lib/ai/summarize'
import { isAIConfigured } from '../lib/ai/client'

const BATCH_SIZE = parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] ?? '50', 10)
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log('=== Backfill Translations Script ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log('')

  // Check AI configuration
  if (!isAIConfigured()) {
    console.error('ERROR: AI is not configured. Set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env.local')
    process.exit(1)
  }
  console.log('AI is configured.')

  const supabase = createServiceClient()

  // Fetch tenders that need translation (missing entity_en OR title_en)
  console.log('Fetching tenders that need translation...')
  const { data: tenders, error } = await supabase
    .from('tenders')
    .select('id, entity, title, entity_en, title_en')
    .or('entity_en.is.null,title_en.is.null')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('ERROR fetching tenders:', error.message)
    process.exit(1)
  }

  if (!tenders || tenders.length === 0) {
    console.log('No tenders need translation. All tenders have entity_en and title_en populated.')
    return
  }

  console.log(`Found ${tenders.length} tenders needing translation.`)
  console.log('')

  // Process in batches
  let totalUpdated = 0
  let totalEntities = 0
  let totalTitles = 0

  for (let i = 0; i < tenders.length; i += BATCH_SIZE) {
    const batch = tenders.slice(i, i + BATCH_SIZE)
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tenders.length / BATCH_SIZE)} (${batch.length} tenders)...`)

    // Extract unique entities and titles that need translation
    const entitiesToTranslate = [...new Set(
      batch
        .filter(t => t.entity_en == null && t.entity)
        .map(t => t.entity)
    )] as string[]

    const titlesToTranslate = [...new Set(
      batch
        .filter(t => t.title_en == null && t.title)
        .map(t => t.title)
    )] as string[]

    console.log(`  - ${entitiesToTranslate.length} unique entities to translate`)
    console.log(`  - ${titlesToTranslate.length} unique titles to translate`)

    if (DRY_RUN) {
      console.log('  [DRY RUN] Would translate:')
      entitiesToTranslate.slice(0, 3).forEach(e => console.log(`    Entity: ${e.substring(0, 50)}...`))
      titlesToTranslate.slice(0, 3).forEach(t => console.log(`    Title: ${t.substring(0, 50)}...`))
      totalEntities += entitiesToTranslate.length
      totalTitles += titlesToTranslate.length
      totalUpdated += batch.length
      continue
    }

    // Translate via AI
    let entityEnMap: Record<string, string> = {}
    let titleEnMap: Record<string, string> = {}

    try {
      const [entityResults, titleResults] = await Promise.all([
        entitiesToTranslate.length > 0 ? summarizeEntitiesBatch(entitiesToTranslate) : Promise.resolve({}),
        titlesToTranslate.length > 0 ? summarizeTitlesBatch(titlesToTranslate) : Promise.resolve({}),
      ])
      entityEnMap = entityResults
      titleEnMap = titleResults
      totalEntities += Object.keys(entityResults).length
      totalTitles += Object.keys(titleResults).length
    } catch (err) {
      console.error(`  ERROR translating batch:`, err)
      continue
    }

    // Update tenders with translations
    for (const tender of batch) {
      const updates: { entity_en?: string; title_en?: string } = {}

      if (tender.entity_en == null && tender.entity && entityEnMap[tender.entity]) {
        updates.entity_en = entityEnMap[tender.entity]
      }

      if (tender.title_en == null && tender.title && titleEnMap[tender.title]) {
        updates.title_en = titleEnMap[tender.title]
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('tenders')
          .update(updates)
          .eq('id', tender.id)

        if (updateError) {
          console.error(`  ERROR updating tender ${tender.id}:`, updateError.message)
        } else {
          totalUpdated++
        }
      }
    }

    console.log(`  Batch complete. Updated ${batch.length} tenders.`)

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < tenders.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Total tenders updated: ${totalUpdated}`)
  console.log(`Total entities translated: ${totalEntities}`)
  console.log(`Total titles translated: ${totalTitles}`)

  if (DRY_RUN) {
    console.log('')
    console.log('This was a DRY RUN. No changes were made.')
    console.log('Run without --dry-run to apply changes.')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
