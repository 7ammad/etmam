import Papa from 'papaparse'
import { mapColumns, validateMappedRow } from './column-mapper'
import type { CreateTenderInput } from '@/types/tender'

export interface ParseResult {
  data: (CreateTenderInput & { raw_data: Record<string, unknown> })[]
  errors: { row: number; message: string }[]
  totalRows: number
  validRows: number
}

export async function parseCSV(
  file: File,
  options?: {
    columnMap?: Record<string, string>
    skipHeader?: boolean
  }
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const results: (CreateTenderInput & { raw_data: Record<string, unknown> })[] = []
    const errors: { row: number; message: string }[] = []
    let rowIndex = 0

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (parseResult) => {
        for (const row of parseResult.data as Record<string, unknown>[]) {
          rowIndex++
          
          try {
            const mapped = mapColumns(row, options?.columnMap)
            const validation = validateMappedRow(mapped)
            
            if (validation.isValid) {
              results.push(mapped as CreateTenderInput & { raw_data: Record<string, unknown> })
            } else {
              errors.push({
                row: rowIndex,
                message: validation.errors.join(', '),
              })
            }
          } catch (error) {
            errors.push({
              row: rowIndex,
              message: error instanceof Error ? error.message : 'Unknown parsing error',
            })
          }
        }

        resolve({
          data: results,
          errors,
          totalRows: rowIndex,
          validRows: results.length,
        })
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      },
    })
  })
}

// Parse CSV from string (for server-side processing)
export function parseCSVString(
  content: string,
  options?: {
    columnMap?: Record<string, string>
  }
): ParseResult {
  const results: (CreateTenderInput & { raw_data: Record<string, unknown> })[] = []
  const errors: { row: number; message: string }[] = []
  let rowIndex = 0

  const parseResult = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  })

  for (const row of parseResult.data as Record<string, unknown>[]) {
    rowIndex++
    
    try {
      const mapped = mapColumns(row, options?.columnMap)
      const validation = validateMappedRow(mapped)
      
      if (validation.isValid) {
        results.push(mapped as CreateTenderInput & { raw_data: Record<string, unknown> })
      } else {
        errors.push({
          row: rowIndex,
          message: validation.errors.join(', '),
        })
      }
    } catch (error) {
      errors.push({
        row: rowIndex,
        message: error instanceof Error ? error.message : 'Unknown parsing error',
      })
    }
  }

  return {
    data: results,
    errors,
    totalRows: rowIndex,
    validRows: results.length,
  }
}
