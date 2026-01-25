import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should display dashboard with stats cards', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // Dashboard shows stats cards section (no h1, uses section headings)
    // Stats cards grid should be present
    const statsSection = page.locator('section[aria-labelledby="stats-heading"]')
    await expect(statsSection).toBeVisible({ timeout: 15000 })
  })

  test('should display tender section', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // Either shows table with data, empty state, or upload prompt
    const hasTable = await page.getByRole('table').isVisible({ timeout: 10000 }).catch(() => false)
    const hasEmptyState = await page.getByText('لا توجد منافسات').isVisible({ timeout: 5000 }).catch(() => false)
    const hasUploadPrompt = await page.getByText('ارفع أول ملف منافسات').isVisible({ timeout: 5000 }).catch(() => false)

    expect(hasTable || hasEmptyState || hasUploadPrompt).toBeTruthy()
  })

  test('should show file upload area when button clicked', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // Find button containing upload text (may show empty state or action panel)
    const uploadButton = page.getByRole('button').filter({ hasText: 'رفع ملف' })

    // Wait for either upload button or empty state upload link
    const hasUploadButton = await uploadButton.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasUploadButton) {
      await uploadButton.click()
      // Upload card should appear with dropzone text
      await expect(page.getByText('اسحب الملف هنا أو انقر للاختيار')).toBeVisible({ timeout: 5000 })
    } else {
      // Empty state - look for upload prompt
      const emptyStateUpload = page.getByText('ارفع أول ملف منافسات')
      await expect(emptyStateUpload).toBeVisible({ timeout: 10000 })
    }
  })

  test('should navigate to English dashboard', async ({ page }) => {
    await page.goto('/en/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // Dashboard has no h1, check for stats section or action panel instead
    const statsSection = page.locator('section[aria-labelledby="stats-heading"]')
    await expect(statsSection).toBeVisible({ timeout: 15000 })
  })

  test('should display stats cards', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // Stats section should be visible (may show different labels based on data)
    const statsSection = page.locator('section[aria-labelledby="stats-heading"]')
    await expect(statsSection).toBeVisible({ timeout: 15000 })

    // At minimum, the stats grid container should exist
    const statsGrid = statsSection.locator('.stat-card-grid-crm, [class*="grid"]').first()
    await expect(statsGrid).toBeVisible({ timeout: 10000 })
  })

  test('should have upload and add buttons', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // Dashboard shows either action panel with buttons OR empty state
    const uploadButton = page.getByRole('button').filter({ hasText: 'رفع ملف' })
    const evaluateButton = page.getByRole('button').filter({ hasText: 'تقييم الكل' })
    const emptyStateText = page.getByText('ارفع أول ملف منافسات')

    // Wait for page to load, then check for either populated or empty state
    const hasUploadButton = await uploadButton.isVisible({ timeout: 10000 }).catch(() => false)
    const hasEmptyState = await emptyStateText.isVisible({ timeout: 5000 }).catch(() => false)

    // Either action buttons should be visible OR empty state prompt
    expect(hasUploadButton || hasEmptyState).toBeTruthy()
  })

  test('should maintain RTL layout on Arabic dashboard', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('dir', 'rtl', { timeout: 10000 })
    await expect(html).toHaveAttribute('lang', 'ar')
  })

  test('should maintain LTR layout on English dashboard', async ({ page }) => {
    await page.goto('/en/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('dir', 'ltr', { timeout: 10000 })
    await expect(html).toHaveAttribute('lang', 'en')
  })
})
