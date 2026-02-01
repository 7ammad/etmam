/**
 * Full pipeline: scrape → evaluate → sync evaluations.
 *
 * Runs in sequence:
 *   1. pnpm scrape:run (with optional --historical)
 *   2. pnpm evaluate-tenders
 *   3. pnpm sync:evaluations
 *
 * Usage: pnpm pipeline:full [--historical]
 *
 * Requires same env as scrape:run + sync:evaluations:
 *   API_URL, CRON_SECRET, (optional) NEXT_PUBLIC_APP_URL for sync target
 */

import { execSync } from 'child_process'
import * as path from 'path'

const root = path.resolve(process.cwd())

function run(name: string, command: string, env?: NodeJS.ProcessEnv): void {
  console.log('')
  console.log('='.repeat(60))
  console.log(`[Pipeline] ${name}`)
  console.log('='.repeat(60))
  const fullEnv = { ...process.env, ...env }
  execSync(command, {
    cwd: root,
    stdio: 'inherit',
    env: fullEnv,
  })
}

function main(): void {
  const historical = process.argv.includes('--historical')
  const scrapeCmd = historical ? 'pnpm scrape:run -- --historical' : 'pnpm scrape:run'

  run('Step 1: Scrape tenders', scrapeCmd)
  run('Step 2: Evaluate tenders', 'pnpm evaluate-tenders')
  run('Step 3: Sync evaluations to database', 'pnpm sync:evaluations')

  console.log('')
  console.log('Pipeline completed successfully.')
}

main()
