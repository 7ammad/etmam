import { chromium } from '@playwright/test';

async function testPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`Page error: ${err.message}`));
  
  console.log('Testing Login Page...');
  try {
    await page.goto('http://localhost:3003/ar/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/login-page.png', fullPage: true });
    console.log('✓ Login page loaded successfully');
    
    if (await page.locator('text=ETMAM').count() > 0) {
      console.log('  ✓ Logo present');
    }
    if (await page.locator('input[type="email"]').count() > 0) {
      console.log('  ✓ Email field present');
    }
    if (await page.locator('input[type="password"]').count() > 0) {
      console.log('  ✓ Password field present');
    }
  } catch (e: any) {
    console.log(`✗ Login page error: ${e.message}`);
  }
  
  console.log('\nTesting Dashboard Page...');
  try {
    await page.goto('http://localhost:3003/ar/dashboard-new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/dashboard-new-page.png', fullPage: true });
    console.log('✓ Dashboard page loaded successfully');
    
    if (await page.locator('text=ETMAM').count() > 0) {
      console.log('  ✓ Logo present');
    }
  } catch (e: any) {
    console.log(`✗ Dashboard page error: ${e.message}`);
  }
  
  console.log('\nTesting Tenders List Page...');
  try {
    await page.goto('http://localhost:3003/ar/tenders-list', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/tenders-list-page.png', fullPage: true });
    console.log('✓ Tenders list page loaded successfully');
    
    if (await page.locator('text=ETMAM').count() > 0) {
      console.log('  ✓ Logo present');
    }
  } catch (e: any) {
    console.log(`✗ Tenders list page error: ${e.message}`);
  }
  
  if (errors.length > 0) {
    console.log('\n⚠ Console Errors Found:');
    errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('\n✓ No console errors detected');
  }
  
  await browser.close();
  return errors.length === 0;
}

testPages().then(success => process.exit(success ? 0 : 1));
