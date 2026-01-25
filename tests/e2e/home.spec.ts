import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should redirect root to a valid locale', async ({ page }) => {
    await page.goto('/')
    // Should redirect to either /ar or /en
    await expect(page).toHaveURL(/\/(ar|en)/)
  })

  test('should display the app title in Arabic', async ({ page }) => {
    await page.goto('/ar')
    await page.waitForLoadState('domcontentloaded')
    // App name "ETMAM" appears in header (uses Latin chars in both locales)
    // Wait for hydration and content to appear
    await expect(page.getByText('ETMAM').first()).toBeVisible({ timeout: 15000 })
  })

  test('should have RTL direction for Arabic locale', async ({ page }) => {
    await page.goto('/ar')
    await page.waitForLoadState('domcontentloaded')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('dir', 'rtl', { timeout: 10000 })
    await expect(html).toHaveAttribute('lang', 'ar')
  })

  test('should display English content on /en route', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('domcontentloaded')
    // App name "ETMAM" appears in header, hero has "End Manual Tender Processing"
    // Wait for hydration and content to appear
    await expect(page.getByText('ETMAM').first()).toBeVisible({ timeout: 15000 })
  })

  test('should have LTR direction for English locale', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('domcontentloaded')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('dir', 'ltr', { timeout: 10000 })
    await expect(html).toHaveAttribute('lang', 'en')
  })

  test('should have dashboard link on home page', async ({ page }) => {
    await page.goto('/ar')
    const dashboardLink = page.locator('a[href*="/ar/dashboard"]')
    await expect(dashboardLink.first()).toBeVisible()
  })

  test('should navigate to dashboard from home', async ({ page }) => {
    await page.goto('/ar')
    await page.locator('a[href*="/ar/dashboard"]').first().click()
    await expect(page).toHaveURL(/\/ar\/dashboard/)
  })

  test('should have theme toggle button', async ({ page }) => {
    await page.goto('/ar')
    const themeToggle = page.getByRole('button', { name: 'Toggle theme' }).first()
    await expect(themeToggle).toBeVisible()
  })
})
