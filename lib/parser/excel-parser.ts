import * as XLSX from 'xlsx'
import { mapColumns, validateMappedRow } from './column-mapper'
import type { CreateTenderInput } from '@/types/tender'
import type { ParseResult } from './csv-parser'

export async function parseExcel(
  file: File,
  options?: {
    columnMap?: Record<string, string>
    sheetIndex?: number
    sheetName?: string
  }
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          throw new Error('Failed to read file')
        }

        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get sheet by name or index
        let sheetName: string
        if (options?.sheetName) {
          sheetName = options.sheetName
        } else {
          const sheetIndex = options?.sheetIndex ?? 0
          sheetName = workbook.SheetNames[sheetIndex]
        }

        if (!sheetName) {
          throw new Error('No sheet found in workbook')
        }

        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) {
          throw new Error(`Sheet "${sheetName}" not found`)
        }

        // Convert to JSON with header
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: '',
          raw: false,
        })

        const results: (CreateTenderInput & { raw_data: Record<string, unknown> })[] = []
        const errors: { row: number; message: string }[] = []
        let rowIndex = 0

        for (const row of jsonData) {
          rowIndex++
          
          try {
            const mapped = mapColumns(row, options?.columnMap)
            const validation = validateMappedRow(mapped)
            
            if (validation.isValid) {
              results.push(mapped as CreateTenderInput & { raw_data: Record<string, unknown> })
            } else {
              errors.push({
                row: rowIndex + 1, // +1 for header row
                message: validation.errors.join(', '),
              })
            }
          } catch (error) {
            errors.push({
              row: rowIndex + 1,
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
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse Excel file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Parse Excel from buffer (for server-side processing)
export function parseExcelBuffer(
  buffer: ArrayBuffer,
  options?: {
    columnMap?: Record<string, string>
    sheetIndex?: number
    sheetName?: string
  }
): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' })
  
  // Get sheet by name or index
  let sheetName: string
  if (options?.sheetName) {
    sheetName = options.sheetName
  } else {
    const sheetIndex = options?.sheetIndex ?? 0
    sheetName = workbook.SheetNames[sheetIndex]
  }

  if (!sheetName) {
    throw new Error('No sheet found in workbook')
  }

  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found`)
  }

  // Convert to JSON with header
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  })

  const results: (CreateTenderInput & { raw_data: Record<string, unknown> })[] = []
  const errors: { row: number; message: string }[] = []
  let rowIndex = 0

  for (const row of jsonData) {
    rowIndex++
    
    try {
      const mapped = mapColumns(row, options?.columnMap)
      const validation = validateMappedRow(mapped)
      
      if (validation.isValid) {
        results.push(mapped as CreateTenderInput & { raw_data: Record<string, unknown> })
      } else {
        errors.push({
          row: rowIndex + 1,
          message: validation.errors.join(', '),
        })
      }
    } catch (error) {
      errors.push({
        row: rowIndex + 1,
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

// Get sheet names from workbook
export function getSheetNames(buffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  return workbook.SheetNames
}
