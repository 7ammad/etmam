import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should redirect root to a valid locale', async ({ page }) => {
    await page.goto('/')
    // Should redirect to either /ar or /en
    await expect(page).toHaveURL(/\/(ar|en)/)
  })

  test('should display the app title in Arabic', async ({ page }) => {
    await page.goto('/ar')
    await expect(page.locator('h1')).toContainText('إتمام')
  })

  test('should have RTL direction for Arabic locale', async ({ page }) => {
    await page.goto('/ar')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('dir', 'rtl')
    await expect(html).toHaveAttribute('lang', 'ar')
  })

  test('should display English content on /en route', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('h1')).toContainText('Etmaam')
  })

  test('should have LTR direction for English locale', async ({ page }) => {
    await page.goto('/en')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('dir', 'ltr')
    await expect(html).toHaveAttribute('lang', 'en')
  })
})
