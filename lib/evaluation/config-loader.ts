/**
 * Load scoring config from config/scoring.config.json (server/Node only).
 * Used by dashboard evaluation action and by scripts; not for client bundle.
 */

import * as fs from 'fs'
import * as path from 'path'
import type { ScoringConfig } from './rules'

const CONFIG_PATH = path.join(process.cwd(), 'config', 'scoring.config.json')

export function loadScoringConfig(): ScoringConfig | null {
  if (!fs.existsSync(CONFIG_PATH)) return null
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as ScoringConfig
    if (!parsed.thresholds || !parsed.weights || !parsed.rules) return null
    return parsed
  } catch {
    return null
  }
}
