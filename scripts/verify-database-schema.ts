#!/usr/bin/env tsx
/**
 * Database Schema Verification Script
 * 
 * Purpose: Verify that the actual database schema matches TypeScript types
 * and migration files. This prevents runtime errors from schema mismatches.
 * 
 * This script should be run:
 * - Before deployment
 * - After migrations
 * - As part of CI/CD pipeline
 * - During code review verification
 */

import { createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type TableName = keyof Database['public']['Tables']
type ColumnName<T extends TableName> = keyof Database['public']['Tables'][T]['Row']

interface SchemaCheck {
  table: string
  column: string
  expectedType: string
  exists: boolean
  actualType?: string
  error?: string
}

const REQUIRED_COLUMNS: Record<string, string[]> = {
  tenders: [
    'id',
    'created_at',
    'updated_at',
    'user_id',
    'entity',
    'title',
    'reference_no',
    'deadline',
    'estimated_value', // This is the one that's failing
    'description',
    'source',
    'status',
    'raw_data',
  ],
  evaluations: [
    'id',
    'created_at',
    'updated_at',
    'tender_id',
    'score',
    'recommendation',
    'summary',
    'strengths',
    'risks',
    'missing_requirements',
    'action_items',
    'breakdown',
    'model_used',
    'oracle_metadata',
    'predicted_budget_min',
    'predicted_budget_max',
    'routing_decision',
  ],
  crm_configs: [
    'id',
    'created_at',
    'updated_at',
    'user_id',
    'provider',
    'name',
    'config',
    'is_active',
    'last_tested_at',
  ],
  crm_pushes: [
    'id',
    'created_at',
    'tender_id',
    'crm_config_id',
    'external_id',
    'status',
    'error_message',
    'response_data',
  ],
}

async function checkColumnExists(
  table: string,
  column: string
): Promise<{ exists: boolean; type?: string; error?: string }> {
  const supabase = createServiceClient()
  
  try {
    // Try to query the column - if it doesn't exist, Supabase will return an error
    // Use type assertion to bypass TypeScript strict checking for dynamic table names
    const { error } = await (supabase
      .from(table as any)
      .select(column)
      .limit(1) as any)
    
    if (error) {
      // Check if error is about missing column
      if (error.code === '42703' || error.message.includes('does not exist')) {
        return { exists: false, error: error.message }
      }
      // Other errors (like RLS) are OK - column exists
      return { exists: true }
    }
    
    return { exists: true }
  } catch (err: any) {
    return { 
      exists: false, 
      error: err.message || 'Unknown error' 
    }
  }
}

async function verifySchema(): Promise<{
  passed: boolean
  checks: SchemaCheck[]
  summary: {
    total: number
    passed: number
    failed: number
  }
}> {
  const checks: SchemaCheck[] = []
  
  console.log('🔍 Verifying database schema...\n')
  
  for (const [tableName, columns] of Object.entries(REQUIRED_COLUMNS)) {
    console.log(`Checking table: ${tableName}`)
    
    for (const column of columns) {
      const result = await checkColumnExists(tableName, column as string)
      const check: SchemaCheck = {
        table: tableName,
        column: column as string,
        expectedType: 'any', // We don't check types yet, just existence
        exists: result.exists,
        actualType: result.type,
        error: result.error,
      }
      
      checks.push(check)
      
      if (result.exists) {
        console.log(`  ✅ ${column}`)
      } else {
        console.log(`  ❌ ${column} - ${result.error || 'Column does not exist'}`)
      }
    }
    
    console.log('')
  }
  
  const passed = checks.every(c => c.exists)
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.exists).length,
    failed: checks.filter(c => !c.exists).length,
  }
  
  return { passed, checks, summary }
}

async function main() {
  try {
    const result = await verifySchema()
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Verification Summary')
    console.log('='.repeat(60))
    console.log(`Total checks: ${result.summary.total}`)
    console.log(`✅ Passed: ${result.summary.passed}`)
    console.log(`❌ Failed: ${result.summary.failed}`)
    console.log('='.repeat(60) + '\n')
    
    if (!result.passed) {
      console.log('❌ SCHEMA VERIFICATION FAILED\n')
      console.log('Failed columns:')
      result.checks
        .filter(c => !c.exists)
        .forEach(c => {
          console.log(`  - ${c.table}.${c.column}`)
          if (c.error) {
            console.log(`    Error: ${c.error}`)
          }
        })
      console.log('\n💡 Action required:')
      console.log('  1. Check if migrations have been applied')
      console.log('  2. Run: npx supabase db reset (local) or apply migrations (production)')
      console.log('  3. Verify TypeScript types match actual schema')
      console.log('  4. Update types/database.ts if schema changed\n')
      process.exit(1)
    } else {
      console.log('✅ SCHEMA VERIFICATION PASSED\n')
      process.exit(0)
    }
  } catch (error: any) {
    console.error('❌ Verification script failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
