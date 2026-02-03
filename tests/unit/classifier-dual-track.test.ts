/**
 * Unit tests for dual-track classifier (Phase 3): detectWorkType, calculateDualScore.
 * Run with: pnpm exec tsx tests/unit/classifier-dual-track.test.ts
 */

import assert from 'node:assert'
import { detectWorkType, calculateDualScore } from '../../lib/evaluation/classifier'

function run(
  name: string,
  fn: () => void
): void {
  try {
    fn()
    console.log(`  ✓ ${name}`)
  } catch (e) {
    console.error(`  ✗ ${name}`)
    throw e
  }
}

console.log('detectWorkType')
run('returns Professional Services for empty text', () => {
  assert.strictEqual(detectWorkType(''), 'Professional Services')
})
run('returns Professional Services for null/undefined (via empty string)', () => {
  assert.strictEqual(detectWorkType(null!), 'Professional Services')
  assert.strictEqual(detectWorkType(undefined!), 'Professional Services')
})
run('returns Commodity when blocklist keyword present (English)', () => {
  assert.strictEqual(detectWorkType('Supply of equipment'), 'Commodity')
  assert.strictEqual(detectWorkType('toner cartridges'), 'Commodity')
  assert.strictEqual(detectWorkType('Office supplies'), 'Commodity')
})
run('returns Commodity when blocklist keyword present (Arabic)', () => {
  assert.strictEqual(detectWorkType('توريد أجهزة'), 'Commodity')
  assert.strictEqual(detectWorkType('نظافة ومكافحة آفات'), 'Commodity')
})
run('returns Commodity case-insensitive', () => {
  assert.strictEqual(detectWorkType('SUPPLY'), 'Commodity')
  assert.strictEqual(detectWorkType('Toner'), 'Commodity')
})
run('returns Professional Services when no blocklist match', () => {
  assert.strictEqual(detectWorkType('Cybersecurity SOC implementation'), 'Professional Services')
  assert.strictEqual(detectWorkType('Platform development'), 'Professional Services')
})

console.log('calculateDualScore')
run('base scores for empty text and entity', () => {
  const r = calculateDualScore('', '')
  assert.strictEqual(r.infratech_score, 30)
  assert.strictEqual(r.exotech_score, 20)
})
run('base scores for null/undefined (treated as empty)', () => {
  const r = calculateDualScore(null!, null!)
  assert.strictEqual(r.infratech_score, 30)
  assert.strictEqual(r.exotech_score, 20)
})
run('Infratech: +15 per INFRATECH_KEYWORDS match', () => {
  const r = calculateDualScore('cyber security infrastructure', '')
  assert.ok(r.infratech_score >= 30 + 15, 'at least one keyword adds 15')
  const r2 = calculateDualScore('cybersecurity SOC NCA', '')
  assert.ok(r2.infratech_score > r.infratech_score, 'multiple keywords add more')
})
run('Infratech: +20 for STRATEGIC_ENTITIES match', () => {
  const r = calculateDualScore('', 'National Cybersecurity Authority')
  assert.strictEqual(r.infratech_score, 30 + 20)
  const r2 = calculateDualScore('', 'SDAIA')
  assert.strictEqual(r2.infratech_score, 30 + 20)
})
run('Infratech: strategic bonus only once', () => {
  const r = calculateDualScore('', 'NCA and SDAIA')
  assert.strictEqual(r.infratech_score, 30 + 20)
})
run('Exotech: +25 per EXOTECH_KEYWORDS match', () => {
  const r = calculateDualScore('AI and data analytics', '')
  assert.ok(r.exotech_score >= 20 + 25)
})
run('Exotech: +15 when Platform AND Development (or Arabic) in text', () => {
  const r = calculateDualScore('Platform and Development project', '')
  assert.ok(r.exotech_score >= 20 + 15, 'base + platform/dev bonus; may include keyword bonuses')
  const r2 = calculateDualScore('منصة وتطوير', '')
  assert.ok(r2.exotech_score >= 20 + 15, 'base + platform/dev bonus; may include keyword bonuses')
})
run('Exotech: no +15 platform/dev bonus when only one of Platform/Development', () => {
  const r = calculateDualScore('Platform only', '')
  assert.strictEqual(r.exotech_score, 20 + 25, 'keyword bonus only, no +15')
  const r2 = calculateDualScore('Development only', '')
  assert.strictEqual(r2.exotech_score, 20 + 25, 'keyword bonus only, no +15')
})
run('Infratech cap at 100', () => {
  const manyInfra = 'cyber cybersecurity SOC infra infrastructure NCA OT ICS CCTV monitoring network security'
  const r = calculateDualScore(manyInfra, 'NCA')
  assert.strictEqual(r.infratech_score, 100)
})
run('Exotech cap at 100', () => {
  const manyExo = 'AI data analytics robotics ML platform development software development digital transformation'
  const r = calculateDualScore(manyExo + ' platform development', '')
  assert.strictEqual(r.exotech_score, 100)
})
run('case-insensitive keyword and entity matching', () => {
  const r = calculateDualScore('CYBERSECURITY', 'national cybersecurity authority')
  assert.ok(r.infratech_score >= 30 + 15 + 20)
})

console.log('\nAll dual-track classifier tests passed.')
