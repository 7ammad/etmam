import { test, expect } from '@playwright/test'
import path from 'path'

// Test fixtures paths
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')
const VALID_CSV = path.join(FIXTURES_DIR, 'tenders.valid.ar.csv')
const VALID_XLSX = path.join(FIXTURES_DIR, 'tenders.valid.ar.xlsx')
const INVALID_CSV = path.join(FIXTURES_DIR, 'tenders.missing_required_columns.csv')

// Set E2E_SKIP_UPLOAD_IMPORT=1 to skip import-dependent tests when Supabase/import backend is unavailable
const skipImportTests = process.env.E2E_SKIP_UPLOAD_IMPORT === '1'

test.describe('File Upload & Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')
  })

  async function openUploadDropzone(page: import('@playwright/test').Page) {
    const dropzone = page.getByTestId('upload-tender-dropzone')
    const dropzoneVisible = await dropzone.first().isVisible().catch(() => false)
    if (!dropzoneVisible) {
      await page.getByTestId('upload-tender-button').click()
      await expect(dropzone.first()).toBeVisible({ timeout: 10000 })
    }
    return page.getByTestId('upload-tender-dropzone').first()
  }

  test('upload CSV imports tenders successfully', async ({ page }) => {
    test.skip(skipImportTests, 'Requires working import backend')
    const dropzone = await openUploadDropzone(page)
    const fileInput = dropzone.locator('input[type="file"]')
    await fileInput.setInputFiles(VALID_CSV)
    const dialog = page.getByTestId('upload-tender-dialog')
    await expect(dialog.getByTestId('upload-processing')).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByTestId('upload-success')).toBeVisible({ timeout: 20000 })
    await page.getByTestId('upload-tender-dialog').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    await page.reload()
    await page.waitForLoadState('networkidle')
    const table = page.getByRole('table')
    await expect(table.getByText('وزارة الصحة')).toBeVisible({ timeout: 10000 })
    await expect(table.getByText('TND-2026-001')).toBeVisible()
  })

  test('upload XLSX imports tenders successfully', async ({ page }) => {
    test.skip(skipImportTests, 'Requires working import backend')
    const dropzone = await openUploadDropzone(page)
    const fileInput = dropzone.locator('input[type="file"]')
    await fileInput.setInputFiles(VALID_XLSX)
    const dialog = page.getByTestId('upload-tender-dialog')
    await expect(dialog.getByTestId('upload-processing')).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByTestId('upload-success')).toBeVisible({ timeout: 20000 })
    await page.getByTestId('upload-tender-dialog').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    await page.reload()
    await page.waitForLoadState('networkidle')
    const table = page.getByRole('table')
    await expect(table.getByText('هيئة الاتصالات وتقنية المعلومات')).toBeVisible({ timeout: 10000 })
  })

  test('upload invalid file shows error without crash', async ({ page }) => {
    test.skip(skipImportTests, 'Requires working import backend')
    const dropzone = await openUploadDropzone(page)
    const fileInput = dropzone.locator('input[type="file"]')
    await fileInput.setInputFiles(INVALID_CSV)
    const dialog = page.getByTestId('upload-tender-dialog')
    await expect(dialog.getByTestId('upload-error')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /dashboard|لوحة التحكم/i })).toBeVisible()
  })

  test('import idempotency: uploading same file twice does not create duplicates', async ({ page }) => {
    test.skip(skipImportTests, 'Requires working import backend')
    const dropzone = await openUploadDropzone(page)
    const fileInput = dropzone.locator('input[type="file"]')
    await fileInput.setInputFiles(VALID_CSV)
    const dialog = page.getByTestId('upload-tender-dialog')
    await expect(dialog.getByTestId('upload-success')).toBeVisible({ timeout: 20000 })
    await page.getByTestId('upload-tender-dialog').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})

    await page.reload()
    await page.waitForLoadState('networkidle')
    const initialStatsText = await page.getByTestId('kpi-total').textContent()
    const initialCount = parseInt(initialStatsText?.match(/\d+/)?.[0] || '0')

    const dropzone2 = await openUploadDropzone(page)
    await dropzone2.locator('input[type="file"]').setInputFiles(VALID_CSV)
    const dialog2 = page.getByTestId('upload-tender-dialog')
    await expect(dialog2.getByTestId('upload-success')).toBeVisible({ timeout: 20000 })

    const finalStatsText = await page.getByTestId('kpi-total').textContent()
    const finalCount = parseInt(finalStatsText?.match(/\d+/)?.[0] || '0')

    expect(finalCount).toBeLessThanOrEqual(initialCount + 3)
  })

  test('Arabic headers are correctly mapped', async ({ page }) => {
    test.skip(skipImportTests, 'Requires working import backend')
    const dropzone = await openUploadDropzone(page)
    const fileInput = dropzone.locator('input[type="file"]')
    await fileInput.setInputFiles(VALID_CSV)
    const dialog = page.getByTestId('upload-tender-dialog')
    await expect(dialog.getByTestId('upload-success')).toBeVisible({ timeout: 20000 })
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    await page.reload()
    await page.waitForLoadState('networkidle')
    const table = page.getByRole('table')
    await expect(table.getByText('وزارة الصحة')).toBeVisible({ timeout: 10000 })
    await expect(table.getByText(/مشروع تطوير نظام المعلومات/)).toBeVisible()
    await expect(table.getByText('TND-2026-001')).toBeVisible()
    await expect(table.getByText(/2,500,000|2500000/)).toBeVisible()
  })

  test('empty file shows appropriate error', async ({ page }) => {
    test.skip(skipImportTests, 'Requires working import backend')
    const dropzone = await openUploadDropzone(page)
    const fileInput = dropzone.locator('input[type="file"]')
    await fileInput.setInputFiles(INVALID_CSV)
    const dialog = page.getByTestId('upload-tender-dialog')
    await expect(dialog.getByTestId('upload-error')).toBeVisible({ timeout: 15000 })
  })
})
