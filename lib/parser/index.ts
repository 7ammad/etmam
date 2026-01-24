import { parseCSV, parseCSVString, type ParseResult } from './csv-parser'
import { parseExcel, parseExcelBuffer, getSheetNames } from './excel-parser'
import type { CreateTenderInput } from '@/types/tender'

export type { ParseResult }

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  csv: ['text/csv', 'application/csv', '.csv'],
  excel: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    '.xlsx',
    '.xls',
  ],
}

// Check if file is supported
export function isFileSupported(file: File): boolean {
  const type = file.type.toLowerCase()
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  return (
    SUPPORTED_FILE_TYPES.csv.includes(type) ||
    SUPPORTED_FILE_TYPES.csv.includes(extension) ||
    SUPPORTED_FILE_TYPES.excel.includes(type) ||
    SUPPORTED_FILE_TYPES.excel.includes(extension)
  )
}

// Get file type
export function getFileType(file: File): 'csv' | 'excel' | 'unknown' {
  const type = file.type.toLowerCase()
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (
    SUPPORTED_FILE_TYPES.csv.includes(type) ||
    SUPPORTED_FILE_TYPES.csv.includes(extension)
  ) {
    return 'csv'
  }

  if (
    SUPPORTED_FILE_TYPES.excel.includes(type) ||
    SUPPORTED_FILE_TYPES.excel.includes(extension)
  ) {
    return 'excel'
  }

  return 'unknown'
}

// Parse file based on type
export async function parseFile(
  file: File,
  options?: {
    columnMap?: Record<string, string>
    sheetIndex?: number
    sheetName?: string
  }
): Promise<ParseResult> {
  const fileType = getFileType(file)

  switch (fileType) {
    case 'csv':
      return parseCSV(file, options)
    case 'excel':
      return parseExcel(file, options)
    default:
      throw new Error(`Unsupported file type: ${file.type || file.name}`)
  }
}

// Re-export individual parsers
export { parseCSV, parseCSVString, parseExcel, parseExcelBuffer, getSheetNames }

// Re-export column mapper utilities
export {
  mapColumns,
  parseDate,
  parseNumber,
  validateMappedRow,
  COLUMN_MAPPING,
} from './column-mapper'
