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
    await page.waitForLoadState('networkidle')

    // Either shows table with data or empty state message
    const hasTable = await page.getByRole('table').isVisible().catch(() => false)
    const hasEmptyState = await page.getByText('لا توجد منافسات').isVisible().catch(() => false)
    
    expect(hasTable || hasEmptyState).toBeTruthy()
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
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dashboard')
  })

  test('should display stats cards', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')

    // Stats labels should be visible
    await expect(page.getByText('المنافسات').first()).toBeVisible()
    await expect(page.getByText('مؤهلة').first()).toBeVisible()
    await expect(page.getByText('مستبعدة').first()).toBeVisible()
    await expect(page.getByText('القيمة الإجمالية').first()).toBeVisible()
    await expect(page.getByText('قيد التقييم').first()).toBeVisible()
  })

  test('should have upload and add buttons', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')

    // Upload button
    const uploadButton = page.getByRole('button').filter({ hasText: 'رفع ملف' })
    await expect(uploadButton).toBeVisible()

    // Add new button
    const addButton = page.getByRole('button').filter({ hasText: 'إضافة منافسة' })
    await expect(addButton).toBeVisible()
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
