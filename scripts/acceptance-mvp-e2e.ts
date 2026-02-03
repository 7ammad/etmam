#!/usr/bin/env npx tsx
/**
 * MVP acceptance: one tender → evaluate → build CRM payload → optional push.
 * Prints evaluation output and opportunity payload; optionally creates CRM opportunity if Odoo env is set.
 *
 * Usage: pnpm exec tsx scripts/acceptance-mvp-e2e.ts [tenderId]
 *   If tenderId omitted, uses first tender from DB (by created_at desc).
 *
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: ODOO_* for actual CRM push
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { getEffectiveEstimatedValueSar, tenderRowToScraped, scoreTenderMVP } from '../lib/evaluation'
import { mvpRecommendationToDb } from '../types/evaluation'
import { getCRMProvider } from '../lib/crm/factory'
import { getOdooConfigFromEnv } from '../lib/crm/odoo-env'
import { opportunityToLeadFields } from '../lib/crm/providers/odoo'
import type { OpportunityData } from '../types/crm'

function loadEnvFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return
    const content = fs.readFileSync(filePath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex <= 0) continue
      const key = trimmed.slice(0, eqIndex)
      let value = trimmed.slice(eqIndex + 1)
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // ignore
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type TenderRow = Database['public']['Tables']['tenders']['Row']

async function main(): Promise<void> {
  const tenderIdArg = process.argv[2]

  // 1) Get one tender
  let tender: TenderRow | null = null
  if (tenderIdArg) {
    const { data, error } = await supabase.from('tenders').select('*').eq('id', tenderIdArg).single()
    if (error || !data) {
      console.error('Tender not found:', tenderIdArg, error?.message ?? '')
      process.exit(1)
    }
    tender = data as TenderRow
  } else {
    const { data, error } = await supabase.from('tenders').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error || !data) {
      console.error('No tenders in DB. Run sync/import first.', error?.message ?? '')
      process.exit(1)
    }
    tender = data as TenderRow
  }

  const tenderId = tender.id
  console.log('--- MVP Acceptance: One Tender E2E ---\n')
  console.log('Tender ID:', tenderId)
  console.log('Reference:', tender.reference_no ?? '—')
  console.log('Title:', (tender.title ?? '').slice(0, 60) + (tender.title && tender.title.length > 60 ? '…' : ''))
  console.log('Entity:', tender.entity ?? '—')
  console.log('Deadline:', tender.deadline ?? '—')
  console.log('')

  // 2) Run evaluation
  const effectiveEv = getEffectiveEstimatedValueSar(tender)
  const scraped = tenderRowToScraped(tender)
  const scored = scoreTenderMVP(scraped, effectiveEv.evSar)

  const summary = scored.top_reasons.join(' · ')
  const dbBreakdown = {
    budget_fit: scored.breakdown.value_fit,
    technical_fit: scored.breakdown.scope_fit,
    timeline_fit: scored.breakdown.time_fit,
    strategic_fit: scored.breakdown.clarity,
    risk_score: scored.breakdown.risk_score,
  }
  const oracleMetadata = {
    estimated_value_sar: effectiveEv.evSar,
    ev_method: effectiveEv.source,
    ev_confidence: effectiveEv.confidence ?? null,
    matched_examples_count: effectiveEv.matched_examples_count ?? null,
  }

  // Upsert evaluation
  const { data: existingEval } = await supabase.from('evaluations').select('id').eq('tender_id', tenderId).maybeSingle()
  const evalRow = {
    tender_id: tenderId,
    score: scored.score,
    recommendation: mvpRecommendationToDb(scored.recommendation),
    summary,
    strengths: null,
    risks: null,
    missing_requirements: null,
    action_items: null,
    breakdown: dbBreakdown as unknown as Database['public']['Tables']['evaluations']['Row']['breakdown'],
    model_used: 'mvp-deterministic',
    predicted_budget_min: effectiveEv.predictedMin,
    predicted_budget_max: effectiveEv.predictedMax,
    oracle_metadata: oracleMetadata as Database['public']['Tables']['evaluations']['Row']['oracle_metadata'],
  }
  if (existingEval) {
    await supabase.from('evaluations').update(evalRow).eq('id', existingEval.id)
  } else {
    await supabase.from('evaluations').insert(evalRow as never)
  }
  await supabase.from('tenders').update({ status: 'evaluated' }).eq('id', tenderId)

  console.log('--- Evaluation result ---')
  console.log('EV (SAR):', effectiveEv.evSar, '| source:', effectiveEv.source)
  console.log('predicted_budget_min:', effectiveEv.predictedMin, '| predicted_budget_max:', effectiveEv.predictedMax)
  console.log('score:', scored.score, '| recommendation:', scored.recommendation)
  console.log('summary:', summary)
  console.log('')

  // 3) Build CRM opportunity payload (same logic as pushToCRM: EV from evaluation when present)
  const pmin = effectiveEv.predictedMin
  const pmax = effectiveEv.predictedMax
  const estimated_value =
    pmin != null && pmax != null ? (pmin === pmax ? pmin : Math.round((pmin + pmax) / 2)) : null

  const opportunityData: OpportunityData = {
    tender_id: tenderId,
    entity: (tender.entity as string) ?? '',
    title: (tender.title as string) ?? '',
    reference_no: (tender.reference_no as string) ?? '',
    deadline: new Date(tender.deadline as string),
    estimated_value,
    score: scored.score,
    recommendation: scored.recommendation,
    summary,
  }

  console.log('--- CRM opportunity payload (required fields) ---')
  console.log('entity:', opportunityData.entity || '(empty)')
  console.log('title:', opportunityData.title || '(empty)')
  console.log('reference_no (tender number):', opportunityData.reference_no || '(empty)')
  console.log('deadline:', opportunityData.deadline?.toISOString?.() ?? opportunityData.deadline)
  console.log('estimated_value (SAR, from evaluation predicted_budget_min/max):', opportunityData.estimated_value ?? '(null)')
  console.log('score:', opportunityData.score)
  console.log('recommendation:', opportunityData.recommendation)
  console.log('summary:', (opportunityData.summary ?? '').slice(0, 80) + (opportunityData.summary && opportunityData.summary.length > 80 ? '…' : ''))
  console.log('')

  const leadFields = opportunityToLeadFields(opportunityData)
  console.log('--- Odoo crm.lead fields (mapping) ---')
  console.log(JSON.stringify(leadFields, null, 2))
  console.log('')

  // 4) Optional: push to CRM if Odoo env is set
  const odooConfig = getOdooConfigFromEnv()
  if (odooConfig) {
    const provider = getCRMProvider('odoo')
    if (provider) {
      const result = await provider.createOpportunity(odooConfig, opportunityData)
      if (result.success) {
        console.log('--- CRM push result ---')
        console.log('success: true | externalId:', result.externalId ?? '—')
      } else {
        console.error('--- CRM push failed ---')
        console.error('error:', result.error)
        process.exit(1)
      }
    } else {
      console.log('Odoo config present but provider not available; skipping push.')
    }
  } else {
    console.log('ODOO_* not set; skipping actual CRM push. Payload above is what would be sent.')
  }

  // Required fields check
  const required = [
    ['entity', opportunityData.entity],
    ['title', opportunityData.title],
    ['reference_no', opportunityData.reference_no],
    ['deadline', opportunityData.deadline],
    ['estimated_value', opportunityData.estimated_value],
    ['score', opportunityData.score],
    ['recommendation', opportunityData.recommendation],
  ] as const
  const missing = required.filter(([, v]) => v === undefined || v === null || v === '')
  if (missing.length > 0) {
    console.error('Required fields missing:', missing.map(([k]) => k).join(', '))
    process.exit(1)
  }
  if (!['INVEST', 'REVIEW', 'SKIP'].includes(opportunityData.recommendation ?? '')) {
    console.error('recommendation must be INVEST, REVIEW, or SKIP; got:', opportunityData.recommendation)
    process.exit(1)
  }
  console.log('All required fields populated; recommendation is INVEST/REVIEW/SKIP.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
