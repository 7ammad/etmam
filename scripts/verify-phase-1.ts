/**
 * Phase 1 Verification Script
 * 
 * Automated verification of Phase 1: Foundation (Database & Schema)
 * Uses skills-based methodology to verify all tasks are complete.
 * 
 * Run: pnpm exec tsx scripts/verify-phase-1.ts
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

type VerificationResult = {
  task: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
}

const results: VerificationResult[] = []

/**
 * Check if file exists and contains required content
 */
function verifyFileContent(
  filePath: string,
  requiredPatterns: RegExp[],
  taskName: string
): VerificationResult {
  if (!existsSync(filePath)) {
    return {
      task: taskName,
      status: 'fail',
      message: `File not found: ${filePath}`,
    }
  }

  const content = readFileSync(filePath, 'utf-8')
  const missing: string[] = []

  for (const pattern of requiredPatterns) {
    if (!pattern.test(content)) {
      missing.push(pattern.toString())
    }
  }

  if (missing.length > 0) {
    return {
      task: taskName,
      status: 'fail',
      message: `Missing required patterns in ${filePath}`,
      details: missing,
    }
  }

  return {
    task: taskName,
    status: 'pass',
    message: `All required patterns found in ${filePath}`,
  }
}

/**
 * Task 1.1: Database Migration Verification
 */
function verifyTask1_1(): VerificationResult {
  const migrationPath = join(process.cwd(), 'supabase/migrations/00004_add_oracle_schema.sql')
  
  if (!existsSync(migrationPath)) {
    return {
      task: 'Task 1.1: Database Migration',
      status: 'fail',
      message: 'Migration file not found: 00004_add_oracle_schema.sql',
    }
  }

  const content = readFileSync(migrationPath, 'utf-8')
  const checks = {
    hasBookletPrice: /booklet_price_sar/i.test(content),
    hasInitialGuarantee: /initial_guarantee_sar/i.test(content),
    hasProjectDuration: /project_duration/i.test(content),
    hasOracleMetadata: /oracle_metadata/i.test(content),
    hasPredictedBudget: /predicted_budget_min|predicted_budget_max/i.test(content),
    hasRoutingDecision: /routing_decision/i.test(content),
    hasEnum: /CREATE TYPE routing_decision/i.test(content),
    hasIndexes: /CREATE INDEX/i.test(content),
    isIdempotent: /IF NOT EXISTS/i.test(content),
  }

  const missing = Object.entries(checks)
    .filter(([_, passed]) => !passed)
    .map(([key]) => key)

  if (missing.length > 0) {
    return {
      task: 'Task 1.1: Database Migration',
      status: 'fail',
      message: 'Migration missing required elements',
      details: missing,
    }
  }

  return {
    task: 'Task 1.1: Database Migration',
    status: 'pass',
    message: 'Migration file exists with all required columns, enum, and indexes',
  }
}

/**
 * Task 1.2.1: Verify types/tender.ts
 */
function verifyTask1_2_1(): VerificationResult {
  const filePath = join(process.cwd(), 'types/tender.ts')
  const patterns = [
    /booklet_price_sar.*z\.number/i,
    /initial_guarantee_sar.*z\.number/i,
    /project_duration.*z\.string/i,
  ]

  return verifyFileContent(
    filePath,
    patterns,
    'Task 1.2.1: types/tender.ts - Scraper Fields'
  )
}

/**
 * Task 1.2.2: Verify lib/ai/schemas.ts
 */
function verifyTask1_2_2(): VerificationResult {
  const filePath = join(process.cwd(), 'lib/ai/schemas.ts')
  const patterns = [
    /oracleOutputSchema|OracleOutputSchema/i,
    /inferred_scope/i,
    /reasoning_chain/i,
    /predicted_budget_min/i,
    /predicted_budget_max/i,
    /routing_decision/i,
    /routingDecisionSchema/i,
    /validateOracleOutput/i,
    /createOracleMetadata/i,
  ]

  return verifyFileContent(
    filePath,
    patterns,
    'Task 1.2.2: lib/ai/schemas.ts - OracleOutputSchema'
  )
}

/**
 * Task 1.2.3: Verify types/database.ts
 */
function verifyTask1_2_3(): VerificationResult {
  const filePath = join(process.cwd(), 'types/database.ts')
  const patterns = [
    /booklet_price_sar/i,
    /initial_guarantee_sar/i,
    /project_duration/i,
    /oracle_metadata/i,
    /predicted_budget_min/i,
    /predicted_budget_max/i,
    /routing_decision/i,
    /INFRATECH.*EXOTECH.*JOINT.*NO_BID/i,
  ]

  return verifyFileContent(
    filePath,
    patterns,
    'Task 1.2.3: types/database.ts - Generated Types'
  )
}

/**
 * Run TypeScript type check
 */
async function runTypeCheck(): Promise<VerificationResult> {
  const { execSync } = await import('child_process')
  
  try {
    const output = execSync('pnpm type-check', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      stdio: 'pipe',
    })

    return {
      task: 'TypeScript Type Check',
      status: 'pass',
      message: 'TypeScript compilation successful',
    }
  } catch (error: any) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message
    
    return {
      task: 'TypeScript Type Check',
      status: 'fail',
      message: 'TypeScript compilation failed',
      details: errorOutput.split('\n').slice(0, 10), // First 10 lines
    }
  }
}

/**
 * Main verification function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('PHASE 1 VERIFICATION: Foundation (Database & Schema)')
  console.log('='.repeat(60))
  console.log('')

  // Task 1.1: Database Migration
  console.log('🔍 Verifying Task 1.1: Database Migration...')
  results.push(verifyTask1_1())

  // Task 1.2.1: types/tender.ts
  console.log('🔍 Verifying Task 1.2.1: types/tender.ts...')
  results.push(verifyTask1_2_1())

  // Task 1.2.2: lib/ai/schemas.ts
  console.log('🔍 Verifying Task 1.2.2: lib/ai/schemas.ts...')
  results.push(verifyTask1_2_2())

  // Task 1.2.3: types/database.ts
  console.log('🔍 Verifying Task 1.2.3: types/database.ts...')
  results.push(verifyTask1_2_3())

  // TypeScript type check
  console.log('🔍 Running TypeScript type check...')
  results.push(await runTypeCheck())

  // Print results
  console.log('')
  console.log('='.repeat(60))
  console.log('VERIFICATION RESULTS')
  console.log('='.repeat(60))
  console.log('')

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const warnings = results.filter((r) => r.status === 'warning').length

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${result.task}`)
    console.log(`   ${result.message}`)
    if (result.details && result.details.length > 0) {
      console.log(`   Details:`)
      result.details.forEach((detail) => console.log(`     - ${detail}`))
    }
    console.log('')
  })

  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log('')

  if (failed === 0) {
    console.log('🎉 Phase 1 Verification: ALL CHECKS PASSED')
    console.log('✅ Phase 1 is COMPLETE and ready for Phase 2')
    process.exit(0)
  } else {
    console.log('⚠️  Phase 1 Verification: SOME CHECKS FAILED')
    console.log('❌ Please fix the issues above before proceeding to Phase 2')
    process.exit(1)
  }
}

// Run verification
main().catch((error) => {
  console.error('Fatal error during verification:', error)
  process.exit(1)
})
