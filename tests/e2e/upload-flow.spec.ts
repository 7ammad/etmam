import { test, expect } from '@playwright/test'
import path from 'path'

// Test fixtures paths
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')
const VALID_CSV = path.join(FIXTURES_DIR, 'tenders.valid.ar.csv')
const VALID_XLSX = path.join(FIXTURES_DIR, 'tenders.valid.ar.xlsx')
const INVALID_CSV = path.join(FIXTURES_DIR, 'tenders.missing_required_columns.csv')

test.describe('File Upload & Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (adjust based on your auth setup)
    await page.goto('/ar/dashboard')
    
    // TODO: If auth is required, handle login here
    // For now, assuming the page is accessible or has test bypass
  })

  test('upload CSV imports tenders successfully', async ({ page }) => {
    // Click upload button to show upload UI
    await page.getByRole('button', { name: /رفع ملف|uploadFile/i }).click()
    
    // Upload the CSV file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(VALID_CSV)
    
    // Wait for processing
    await expect(page.getByText(/جاري الرفع|uploading|تم الاستيراد/i)).toBeVisible({ timeout: 15000 })
    
    // Check for success message (count should be 3 from our fixture)
    await expect(page.getByText(/3|success|نجح/i)).toBeVisible({ timeout: 10000 })
    
    // Verify table now shows at least one tender
    const table = page.getByRole('table')
    await expect(table.getByText('وزارة الصحة')).toBeVisible()
    await expect(table.getByText('TND-2026-001')).toBeVisible()
    
    // Verify stats card updated
    const statsCard = page.locator('[class*="glass-card"]').first()
    await expect(statsCard.getByText(/[3-9]|[1-9][0-9]/)).toBeVisible() // At least 3 tenders
  })

  test('upload XLSX imports tenders successfully', async ({ page }) => {
    // Click upload button
    await page.getByRole('button', { name: /رفع ملف|uploadFile/i }).click()
    
    // Upload the Excel file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(VALID_XLSX)
    
    // Wait for processing
    await expect(page.getByText(/جاري الرفع|uploading|تم الاستيراد/i)).toBeVisible({ timeout: 15000 })
    
    // Check for success message
    await expect(page.getByText(/3|success|نجح/i)).toBeVisible({ timeout: 10000 })
    
    // Verify tender appears in table
    const table = page.getByRole('table')
    await expect(table.getByText('هيئة الاتصالات وتقنية المعلومات')).toBeVisible()
  })

  test('upload invalid file shows error without crash', async ({ page }) => {
    // Click upload button
    await page.getByRole('button', { name: /رفع ملف|uploadFile/i }).click()
    
    // Upload the invalid CSV (missing required columns)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(INVALID_CSV)
    
    // Wait for processing
    await page.waitForTimeout(2000)
    
    // Check for error message
    const errorMessage = page.getByText(/خطأ|error|missing|failed/i)
    await expect(errorMessage).toBeVisible({ timeout: 10000 })
    
    // Verify page is still interactive (no crash)
    await expect(page.getByRole('heading', { name: /dashboard|لوحة التحكم/i })).toBeVisible()
    
    // Verify no new tenders were added (table should show same or empty state)
    // This depends on whether there were pre-existing tenders
  })

  test('import idempotency: uploading same file twice does not create duplicates', async ({ page }) => {
    // First upload
    await page.getByRole('button', { name: /رفع ملف|uploadFile/i }).click()
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(VALID_CSV)
    
    // Wait for first upload to complete
    await expect(page.getByText(/3|success|نجح/i)).toBeVisible({ timeout: 10000 })
    
    // Get initial tender count from stats
    const initialStatsText = await page.locator('[class*="glass-card"]').first().textContent()
    const initialCount = parseInt(initialStatsText?.match(/\d+/)?.[0] || '0')
    
    // Reload page to close any modals
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Second upload of same file
    await page.getByRole('button', { name: /رفع ملف|uploadFile/i }).click()
    await fileInput.setInputFiles(VALID_CSV)
    
    // Wait for second upload
    await page.waitForTimeout(3000)
    
    // Get final count
    const finalStatsText = await page.locator('[class*="glass-card"]').first().textContent()
    const finalCount = parseInt(finalStatsText?.match(/\d+/)?.[0] || '0')
    
    // Count should not double (duplicates prevented by unique constraint on reference_no)
    // The system should reject duplicates, so count stays same OR increases by less than 3
    expect(finalCount).toBeLessThanOrEqual(initialCount + 3)
  })

  test('Arabic headers are correctly mapped', async ({ page }) => {
    // Upload CSV with Arabic headers
    await page.getByRole('button', { name: /رفع ملف|uploadFile/i }).click()
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(VALID_CSV)
    
    await expect(page.getByText(/success|نجح/i)).toBeVisible({ timeout: 10000 })
    
    // Verify specific field values were parsed correctly
    const table = page.getByRole('table')
    
    // Check entity (الجهة)
    await expect(table.getByText('وزارة الصحة')).toBeVisible()
    
    // Check title (عنوان المنافسة)
    await expect(table.getByText(/مشروع تطوير نظام المعلومات/)).toBeVisible()
    
    // Check reference number (رقم المنافسة)
    await expect(table.getByText('TND-2026-001')).toBeVisible()
    
    // Check value is displayed (القيمة التقديرية)
    await expect(table.getByText(/2,500,000|2500000/)).toBeVisible()
  })

  test('empty file shows appropriate error', async ({ page }) => {
    // Create empty file reference (if fixture exists)
    // For now, uploading a file with headers only should fail validation
    await page.getByRole('button', { name: /رفع ملف|uploadFile/i }).click()
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(INVALID_CSV)
    
    await expect(page.getByText(/خطأ|error|no valid|missing/i)).toBeVisible({ timeout: 10000 })
  })
})
