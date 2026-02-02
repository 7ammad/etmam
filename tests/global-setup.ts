/**
 * Playwright global setup: log in and save storage state for authenticated tests.
 * Reads PLAYWRIGHT_AUTH_EMAIL and PLAYWRIGHT_AUTH_PASSWORD from env or from .env.local.
 */
import { chromium, type FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_STATE_PATH = path.join(process.cwd(), 'playwright', '.auth', 'state.json')

function loadEnvLocal() {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return
  const content = fs.readFileSync(p, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = value
  }
}

export default async function globalSetup(config: FullConfig) {
  loadEnvLocal()
  const baseURL = config.projects[0]?.use?.baseURL ?? process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000'
  const email = process.env.PLAYWRIGHT_AUTH_EMAIL
  const password = process.env.PLAYWRIGHT_AUTH_PASSWORD

  const dir = path.dirname(AUTH_STATE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL })

  if (email && password) {
    const page = await context.newPage()
    try {
      await page.goto('/en/login', { waitUntil: 'networkidle' })
      await page.locator('#email').fill(email)
      await page.locator('#password').fill(password)
      await page.getByRole('button', { name: /Login|Sign in|تسجيل الدخول/i }).click()
      await page.waitForURL(/\/(en|ar)\/dashboard/, { timeout: 15000 })
    } catch (e) {
      await browser.close()
      throw e
    }
  }

  await context.storageState({ path: AUTH_STATE_PATH })
  await browser.close()
}
