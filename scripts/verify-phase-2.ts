/**
 * Phase 2 Verification Script
 * 
 * Comprehensive verification of Phase 2: The "Oracle" Pipeline (Backend)
 * Uses skills-based methodology to verify all tasks are complete and follow best practices.
 * 
 * Skills Used:
 * - verification-before-completion: Evidence-based verification
 * - code-reviewer: Code quality and best practices
 * - ai-sdk-core: AI SDK implementation verification
 * - senior-backend: Backend patterns verification
 * - supabase-postgres-best-practices: Database operations verification
 * 
 * Run: pnpm exec tsx scripts/verify-phase-2.ts
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

type VerificationResult = {
  task: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
  evidence?: string
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
 * Verify Task 2.1: AI Configuration
 * Skills: ai-sdk-core, senior-backend
 */
function verifyTask2_1(): VerificationResult {
  console.log('  Checking Task 2.1: AI Configuration...')
  
  const checks: VerificationResult[] = []

  // Check 1: AI SDK packages installed
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    if (!deps['ai']) {
      checks.push({
        task: 'Task 2.1.1',
        status: 'fail',
        message: 'AI SDK package "ai" not found in package.json',
      })
    } else {
      checks.push({
        task: 'Task 2.1.1',
        status: 'pass',
        message: `AI SDK installed: ${deps['ai']}`,
      })
    }

    if (!deps['@ai-sdk/openai']) {
      checks.push({
        task: 'Task 2.1.2',
        status: 'fail',
        message: '@ai-sdk/openai package not found in package.json',
      })
    } else {
      checks.push({
        task: 'Task 2.1.2',
        status: 'pass',
        message: `OpenAI SDK installed: ${deps['@ai-sdk/openai']}`,
      })
    }
  } catch (error) {
    checks.push({
      task: 'Task 2.1',
      status: 'fail',
      message: `Failed to read package.json: ${error}`,
    })
  }

  // Check 2: lib/ai/client.ts exists and has required functions
  const clientChecks = verifyFileContent(
    'lib/ai/client.ts',
    [
      /generateObject/,
      /getAIModel/,
      /generateOracleOutput/,
      /APICallError|NoObjectGeneratedError/,
      /maxRetries/,
    ],
    'Task 2.1.3: AI Client Implementation'
  )
  checks.push(clientChecks)

  // Check 3: Error handling with retry logic (ai-sdk-core best practices)
  if (clientChecks.status === 'pass') {
    const clientContent = readFileSync('lib/ai/client.ts', 'utf-8')
    if (!clientContent.includes('exponential backoff') && !clientContent.includes('Math.pow(2')) {
      checks.push({
        task: 'Task 2.1.4',
        status: 'warning',
        message: 'Retry logic may not use exponential backoff pattern',
      })
    } else {
      checks.push({
        task: 'Task 2.1.4',
        status: 'pass',
        message: 'Retry logic with exponential backoff found',
      })
    }
  }

  const hasFailures = checks.some(c => c.status === 'fail')
  const hasWarnings = checks.some(c => c.status === 'warning')

  return {
    task: 'Task 2.1: AI Configuration',
    status: hasFailures ? 'fail' : hasWarnings ? 'warning' : 'pass',
    message: `${checks.filter(c => c.status === 'pass').length}/${checks.length} checks passed`,
    details: checks.map(c => `${c.task}: ${c.message}`),
  }
}

/**
 * Verify Task 2.2: The Oracle Prompt
 * Skills: senior-prompt-engineer, ai-sdk-core
 */
function verifyTask2_2(): VerificationResult {
  console.log('  Checking Task 2.2: The Oracle Prompt...')
  
  const checks: VerificationResult[] = []

  // Check 1: prompts.ts exists
  const promptsCheck = verifyFileContent(
    'lib/ai/prompts.ts',
    [
      /SYSTEM_PROMPT_ORACLE/,
      /buildOraclePrompt/,
    ],
    'Task 2.2.1: Prompt File Exists'
  )
  checks.push(promptsCheck)

  if (promptsCheck.status === 'pass') {
    const promptsContent = readFileSync('lib/ai/prompts.ts', 'utf-8')

    // Check 2: 3-Stage Chain-of-Thought structure (Architect Design alignment)
    const stageChecks = [
      { name: 'REQUIREMENT HALLUCINATION', pattern: /REQUIREMENT.*HALLUCINATION|Stage 1.*Scope/i },
      { name: 'BUDGET TRIANGULATION', pattern: /BUDGET.*TRIANGULATION|Stage 2.*Budget/i },
      { name: 'FIT SCORING', pattern: /FIT.*SCORING|Stage 3.*Routing/i },
    ]

    for (const stage of stageChecks) {
      if (stage.pattern.test(promptsContent)) {
        checks.push({
          task: `Task 2.2.2: ${stage.name}`,
          status: 'pass',
          message: `${stage.name} stage found in prompt`,
        })
      } else {
        checks.push({
          task: `Task 2.2.2: ${stage.name}`,
          status: 'fail',
          message: `${stage.name} stage not found in prompt`,
        })
      }
    }

    // Check 3: Initial Guarantee calculation logic
    if (/Initial Guarantee|initial_guarantee|Guarantee.*\(X\/100\)/i.test(promptsContent)) {
      checks.push({
        task: 'Task 2.2.3',
        status: 'pass',
        message: 'Initial Guarantee calculation logic found',
      })
    } else {
      checks.push({
        task: 'Task 2.2.3',
        status: 'fail',
        message: 'Initial Guarantee calculation logic not found',
      })
    }

    // Check 4: Routing decision logic (INFRATECH, EXOTECH, JOINT, NO_BID)
    const routingPatterns = [
      /INFRATECH/i,
      /EXOTECH/i,
      /JOINT/i,
      /NO_BID/i,
    ]
    const routingFound = routingPatterns.filter(p => p.test(promptsContent)).length
    if (routingFound >= 3) {
      checks.push({
        task: 'Task 2.2.4',
        status: 'pass',
        message: `Routing decision logic found (${routingFound}/4 routing options)`,
      })
    } else {
      checks.push({
        task: 'Task 2.2.4',
        status: 'warning',
        message: `Some routing options may be missing (found ${routingFound}/4)`,
      })
    }

    // Check 5: Few-shot examples (prompt engineering best practice)
    if (/FEW-SHOT|Example|few-shot/i.test(promptsContent)) {
      checks.push({
        task: 'Task 2.2.5',
        status: 'pass',
        message: 'Few-shot examples found in prompt',
      })
    } else {
      checks.push({
        task: 'Task 2.2.5',
        status: 'warning',
        message: 'Few-shot examples not found (recommended for better output quality)',
      })
    }
  }

  const hasFailures = checks.some(c => c.status === 'fail')
  const hasWarnings = checks.some(c => c.status === 'warning')

  return {
    task: 'Task 2.2: The Oracle Prompt',
    status: hasFailures ? 'fail' : hasWarnings ? 'warning' : 'pass',
    message: `${checks.filter(c => c.status === 'pass').length}/${checks.length} checks passed`,
    details: checks.map(c => `${c.task}: ${c.message}`),
  }
}

/**
 * Verify Task 2.3: Oracle Action
 * Skills: ai-sdk-core, senior-backend, supabase-postgres-best-practices
 */
function verifyTask2_3(): VerificationResult {
  console.log('  Checking Task 2.3: Oracle Action...')
  
  const checks: VerificationResult[] = []

  // Check 1: oracle.ts action exists
  const actionCheck = verifyFileContent(
    'app/actions/oracle.ts',
    [
      /runOracleEvaluation/,
      /'use server'/,
      /generateOracleOutput/,
    ],
    'Task 2.3.1: Oracle Action File'
  )
  checks.push(actionCheck)

  if (actionCheck.status === 'pass') {
    const actionContent = readFileSync('app/actions/oracle.ts', 'utf-8')

    // Check 2: Authentication check (senior-backend best practice)
    if (/getUser|auth\.getUser|createClient.*supabase/i.test(actionContent)) {
      checks.push({
        task: 'Task 2.3.2',
        status: 'pass',
        message: 'Authentication check found',
      })
    } else {
      checks.push({
        task: 'Task 2.3.2',
        status: 'warning',
        message: 'Authentication check not found (recommended for server actions)',
      })
    }

    // Check 3: Cache check logic
    if (/getEvaluationByTenderId|oracle_metadata|existingEvaluation/i.test(actionContent)) {
      checks.push({
        task: 'Task 2.3.3',
        status: 'pass',
        message: 'Cache check logic found',
      })
    } else {
      checks.push({
        task: 'Task 2.3.3',
        status: 'fail',
        message: 'Cache check logic not found',
      })
    }

    // Check 4: Error handling (ai-sdk-core best practices)
    const errorHandlingPatterns = [
      /try.*catch|catch.*error/i,
      /APICallError|NoObjectGeneratedError/i,
      /rate limit|429|retry/i,
    ]
    const errorHandlingFound = errorHandlingPatterns.filter(p => p.test(actionContent)).length
    if (errorHandlingFound >= 2) {
      checks.push({
        task: 'Task 2.3.4',
        status: 'pass',
        message: 'Error handling found',
      })
    } else {
      checks.push({
        task: 'Task 2.3.4',
        status: 'warning',
        message: 'Error handling may be incomplete',
      })
    }

    // Check 5: Database upsert with Oracle fields
    const dbPatterns = [
      /upsertEvaluation/,
      /oracle_metadata/,
      /predicted_budget_min|predicted_budget_max/,
      /routing_decision/,
    ]
    const dbFound = dbPatterns.filter(p => p.test(actionContent)).length
    if (dbFound >= 3) {
      checks.push({
        task: 'Task 2.3.5',
        status: 'pass',
        message: `Database upsert logic found (${dbFound}/4 fields)`,
      })
    } else {
      checks.push({
        task: 'Task 2.3.5',
        status: 'fail',
        message: `Database upsert may be incomplete (found ${dbFound}/4 fields)`,
      })
    }

    // Check 6: Structured logging (logging-best-practices)
    if (/console\.log.*\[Oracle\]|console\.error.*\[Oracle\]/i.test(actionContent)) {
      checks.push({
        task: 'Task 2.3.6',
        status: 'pass',
        message: 'Structured logging found',
      })
    } else {
      checks.push({
        task: 'Task 2.3.6',
        status: 'warning',
        message: 'Structured logging not found (recommended)',
      })
    }
  }

  // Check 7: Database query function supports Oracle fields
  const queriesCheck = verifyFileContent(
    'lib/queries/evaluation.ts',
    [
      /upsertEvaluation/,
      /oracle_metadata|predicted_budget|routing_decision/,
    ],
    'Task 2.3.7: Database Query Support'
  )
  checks.push(queriesCheck)

  const hasFailures = checks.some(c => c.status === 'fail')
  const hasWarnings = checks.some(c => c.status === 'warning')

  return {
    task: 'Task 2.3: Oracle Action',
    status: hasFailures ? 'fail' : hasWarnings ? 'warning' : 'pass',
    message: `${checks.filter(c => c.status === 'pass').length}/${checks.length} checks passed`,
    details: checks.map(c => `${c.task}: ${c.message}`),
  }
}

/**
 * Verify TypeScript compilation
 * Skills: verification-before-completion
 */
async function runTypeCheck(): Promise<VerificationResult> {
  try {
    console.log('  Running TypeScript type check...')
    execSync('pnpm type-check', { stdio: 'pipe' })
    return {
      task: 'TypeScript Type Check',
      status: 'pass',
      message: 'TypeScript compilation successful',
      evidence: 'pnpm type-check exited with code 0',
    }
  } catch (error: any) {
    return {
      task: 'TypeScript Type Check',
      status: 'fail',
      message: 'TypeScript compilation failed',
      evidence: error.stdout?.toString() || error.message,
    }
  }
}

/**
 * Verify database migration includes Oracle fields
 * Skills: supabase-postgres-best-practices
 */
function verifyDatabaseMigration(): VerificationResult {
  console.log('  Checking database migration...')
  
  const migrationFile = 'supabase/migrations/00004_add_oracle_schema.sql'
  
  if (!existsSync(migrationFile)) {
    return {
      task: 'Database Migration',
      status: 'fail',
      message: `Migration file not found: ${migrationFile}`,
    }
  }

  const migrationContent = readFileSync(migrationFile, 'utf-8')
  const requiredFields = [
    /oracle_metadata.*jsonb/i,
    /predicted_budget_min|predicted_budget_max/i,
    /routing_decision/i,
    /CREATE INDEX.*oracle_metadata.*gin/i, // GIN index for JSONB (best practice)
  ]

  const missing: string[] = []
  for (const pattern of requiredFields) {
    if (!pattern.test(migrationContent)) {
      missing.push(pattern.toString())
    }
  }

  if (missing.length > 0) {
    return {
      task: 'Database Migration',
      status: 'fail',
      message: 'Migration missing required Oracle fields or indexes',
      details: missing,
    }
  }

  return {
    task: 'Database Migration',
    status: 'pass',
    message: 'Migration includes all Oracle fields and GIN index',
  }
}

/**
 * Verify schema alignment
 */
function verifySchemaAlignment(): VerificationResult {
  console.log('  Checking schema alignment...')
  
  const checks: VerificationResult[] = []

  // Check 1: oracleOutputSchema exists
  const schemaCheck = verifyFileContent(
    'lib/ai/schemas.ts',
    [
      /oracleOutputSchema|OracleOutput/,
      /predicted_budget_min|predicted_budget_max/,
      /routing_decision/,
    ],
    'Task 2.4.1: Oracle Schema'
  )
  checks.push(schemaCheck)

  // Check 2: Schema exports
  if (schemaCheck.status === 'pass') {
    const indexContent = readFileSync('lib/ai/index.ts', 'utf-8')
    if (/export.*oracleOutputSchema|export.*OracleOutput/i.test(indexContent)) {
      checks.push({
        task: 'Task 2.4.2',
        status: 'pass',
        message: 'Oracle schema exported from index.ts',
      })
    } else {
      checks.push({
        task: 'Task 2.4.2',
        status: 'warning',
        message: 'Oracle schema may not be exported',
      })
    }
  }

  const hasFailures = checks.some(c => c.status === 'fail')
  const hasWarnings = checks.some(c => c.status === 'warning')

  return {
    task: 'Task 2.4: Schema Alignment',
    status: hasFailures ? 'fail' : hasWarnings ? 'warning' : 'pass',
    message: `${checks.filter(c => c.status === 'pass').length}/${checks.length} checks passed`,
    details: checks.map(c => `${c.task}: ${c.message}`),
  }
}

/**
 * Main verification function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('PHASE 2 VERIFICATION: The "Oracle" Pipeline (Backend)')
  console.log('='.repeat(60))
  console.log('')
  console.log('🔍 Verifying Task 2.1: AI Configuration...')
  results.push(verifyTask2_1())
  
  console.log('🔍 Verifying Task 2.2: The Oracle Prompt...')
  results.push(verifyTask2_2())
  
  console.log('🔍 Verifying Task 2.3: Oracle Action...')
  results.push(verifyTask2_3())
  
  console.log('🔍 Verifying Task 2.4: Schema Alignment...')
  results.push(verifySchemaAlignment())
  
  console.log('🔍 Verifying Database Migration...')
  results.push(verifyDatabaseMigration())
  
  console.log('🔍 Running TypeScript type check...')
  results.push(await runTypeCheck())

  // Print results
  console.log('')
  console.log('='.repeat(60))
  console.log('VERIFICATION RESULTS')
  console.log('='.repeat(60))
  console.log('')

  let passed = 0
  let failed = 0
  let warnings = 0

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${result.task}: ${result.message}`)
    
    if (result.details) {
      for (const detail of result.details) {
        console.log(`   ${detail}`)
      }
    }

    if (result.evidence) {
      console.log(`   Evidence: ${result.evidence.substring(0, 100)}...`)
    }

    if (result.status === 'pass') passed++
    else if (result.status === 'fail') failed++
    else warnings++

    console.log('')
  }

  // Summary
  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('')

  if (failed === 0) {
    console.log('🎉 Phase 2 Verification: ALL CHECKS PASSED')
    console.log('✅ Phase 2 is COMPLETE and ready for Phase 3')
    process.exit(0)
  } else {
    console.log('⚠️  Phase 2 Verification: SOME CHECKS FAILED')
    console.log('❌ Please fix the issues above before proceeding to Phase 3')
    process.exit(1)
  }
}

// Run verification
main().catch((error) => {
  console.error('Verification script error:', error)
  process.exit(1)
})
