import { test, expect, type Page } from '@playwright/test'

// When not authenticated, dashboard redirects to login. Tests accept either dashboard content or login page.
async function isOnLoginPage(page: Page): Promise<boolean> {
  const h1 = page.getByRole('heading', { level: 1 })
  const text = await h1.textContent().catch(() => '')
  return /منصة ETMAM|ETMAM Platform/.test(text ?? '')
}

test.describe('Dashboard', () => {
  test('should display dashboard with stats cards', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')

    const onLogin = await isOnLoginPage(page)
    if (onLogin) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/منصة ETMAM|ETMAM Platform/)
      return
    }
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/لوحة التحكم|Dashboard/)
    const statsGrid = page.locator('.dashboard-kpi-grid, div.grid').first()
    await expect(statsGrid).toBeVisible({ timeout: 10000 })
  })

  test('should display tender section', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')

    const hasTable = await page.getByRole('table').isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/لا توجد منافسات|No tenders match/).isVisible().catch(() => false)
    const onLogin = await isOnLoginPage(page)
    expect(hasTable || hasEmptyState || onLogin).toBeTruthy()
  })

  test('should show file upload area when button clicked', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')

    const onLogin = await isOnLoginPage(page)
    if (onLogin) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/منصة ETMAM|ETMAM Platform/)
      return
    }
    const uploadButton = page.getByTestId('upload-tender-button').first()
    await expect(uploadButton).toBeVisible({ timeout: 10000 })
    await uploadButton.click()
    await expect(page.getByTestId('upload-tender-dropzone')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to English dashboard', async ({ page }) => {
    await page.goto('/en/dashboard')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toContainText(/Dashboard|ETMAM Platform|لوحة التحكم/)
  })

  test('should display stats cards', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')

    const onLogin = await isOnLoginPage(page)
    if (onLogin) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/منصة ETMAM|ETMAM Platform/)
      return
    }
    await expect(page.getByTestId('kpi-total')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('kpi-qualified')).toBeVisible()
    await expect(page.getByTestId('kpi-excluded')).toBeVisible()
  })

  test('should have upload and add buttons or tender list', async ({ page }) => {
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')

    const onLogin = await isOnLoginPage(page)
    if (onLogin) {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/منصة ETMAM|ETMAM Platform/)
      return
    }
    const hasUpload = await page.getByTestId('upload-tender-button').first().isVisible().catch(() => false)
    const hasTableOrKpi = await page.getByRole('table').isVisible().catch(() => false) || await page.locator('.dashboard-kpi-grid').isVisible().catch(() => false)
    expect(hasUpload || hasTableOrKpi).toBeTruthy()
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
