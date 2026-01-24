import type { CreateTenderInput } from '@/types/tender'

// Arabic to English column mapping
export const COLUMN_MAPPING: Record<string, keyof CreateTenderInput> = {
  // Arabic columns
  'الجهة': 'entity',
  'جهة': 'entity',
  'اسم الجهة': 'entity',
  'الجهة الحكومية': 'entity',
  
  'عنوان المنافسة': 'title',
  'العنوان': 'title',
  'اسم المنافسة': 'title',
  'المنافسة': 'title',
  
  'رقم المنافسة': 'reference_no',
  'الرقم': 'reference_no',
  'رقم المرجع': 'reference_no',
  'الرقم المرجعي': 'reference_no',
  
  'الموعد النهائي': 'deadline',
  'موعد التقديم': 'deadline',
  'تاريخ الإغلاق': 'deadline',
  'آخر موعد': 'deadline',
  'تاريخ الانتهاء': 'deadline',
  
  'القيمة التقديرية': 'estimated_value',
  'القيمة': 'estimated_value',
  'القيمة المقدرة': 'estimated_value',
  'المبلغ': 'estimated_value',
  
  'الوصف': 'description',
  'التفاصيل': 'description',
  'وصف المنافسة': 'description',
  
  'المصدر': 'source',
  
  // English columns (for flexibility)
  'Entity': 'entity',
  'entity': 'entity',
  'Government Entity': 'entity',
  
  'Title': 'title',
  'title': 'title',
  'Tender Title': 'title',
  
  'Reference No': 'reference_no',
  'reference_no': 'reference_no',
  'Reference Number': 'reference_no',
  'Ref No': 'reference_no',
  'ID': 'reference_no',
  
  'Deadline': 'deadline',
  'deadline': 'deadline',
  'Due Date': 'deadline',
  'Closing Date': 'deadline',
  
  'Estimated Value': 'estimated_value',
  'estimated_value': 'estimated_value',
  'Value': 'estimated_value',
  'Amount': 'estimated_value',
  
  'Description': 'description',
  'description': 'description',
  
  'Source': 'source',
  'source': 'source',
}

// Normalize column name (trim, lowercase for matching)
export function normalizeColumnName(name: string): string {
  return name.trim()
}

// Map raw data columns to our schema
export function mapColumns(
  row: Record<string, unknown>,
  columnMap?: Record<string, string>
): Partial<CreateTenderInput> & { raw_data: Record<string, unknown> } {
  const result: Partial<CreateTenderInput> = {}
  const customMap = columnMap || {}

  // Store original data
  const raw_data = { ...row }

  for (const [originalKey, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(originalKey)
    
    // Check custom mapping first, then default mapping
    const mappedKey = customMap[normalizedKey] || COLUMN_MAPPING[normalizedKey]
    
    if (mappedKey && value !== undefined && value !== null && value !== '') {
      switch (mappedKey) {
        case 'entity':
        case 'title':
        case 'reference_no':
        case 'description':
        case 'source':
          result[mappedKey] = String(value).trim()
          break
        case 'deadline':
          result[mappedKey] = parseDate(value)
          break
        case 'estimated_value':
          result[mappedKey] = parseNumber(value)
          break
      }
    }
  }

  return { ...result, raw_data }
}

// Parse various date formats
export function parseDate(value: unknown): Date {
  if (value instanceof Date) return value
  
  const str = String(value).trim()
  
  // Try different date formats
  const formats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}/,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY/MM/DD
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
  ]

  // Try ISO first
  const isoDate = new Date(str)
  if (!isNaN(isoDate.getTime())) {
    return isoDate
  }

  // Try DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Default to current date if parsing fails
  console.warn(`Could not parse date: ${str}`)
  return new Date()
}

// Parse number from various formats
export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (value === null || value === undefined || value === '') return null

  const str = String(value)
    .trim()
    .replace(/[,،]/g, '')  // Remove commas (Arabic and English)
    .replace(/[^\d.-]/g, '') // Keep only digits, dots, and minus

  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// Validate mapped row has required fields
export function validateMappedRow(row: Partial<CreateTenderInput>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!row.entity) errors.push('Missing entity (الجهة)')
  if (!row.title) errors.push('Missing title (عنوان المنافسة)')
  if (!row.reference_no) errors.push('Missing reference number (رقم المنافسة)')
  if (!row.deadline) errors.push('Missing deadline (الموعد النهائي)')

  return {
    isValid: errors.length === 0,
    errors,
  }
}
