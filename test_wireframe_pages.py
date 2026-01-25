from playwright.sync_api import sync_playwright
import sys

def test_pages():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Track console errors
        errors = []
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
        page.on('pageerror', lambda err: errors.append(f'Page error: {err}'))
        
        print("Testing Login Page...")
        try:
            page.goto('http://localhost:3002/ar/login', wait_until='networkidle')
            page.wait_for_timeout(2000)
            page.screenshot(path='screenshots/login-page.png', full_page=True)
            print("✓ Login page loaded successfully")
            
            # Check for key elements
            if page.locator('text=ETMAM').count() > 0:
                print("  ✓ Logo present")
            if page.locator('input[type="email"]').count() > 0:
                print("  ✓ Email field present")
            if page.locator('input[type="password"]').count() > 0:
                print("  ✓ Password field present")
        except Exception as e:
            print(f"✗ Login page error: {e}")
        
        print("\nTesting Dashboard Page...")
        try:
            page.goto('http://localhost:3002/ar/dashboard-new', wait_until='networkidle')
            page.wait_for_timeout(2000)
            page.screenshot(path='screenshots/dashboard-new-page.png', full_page=True)
            print("✓ Dashboard page loaded successfully")
            
            # Check for key elements
            if page.locator('text=ETMAM').count() > 0:
                print("  ✓ Logo present")
            if page.locator('text=لوحة التحكم').count() > 0 or page.locator('text=Dashboard').count() > 0:
                print("  ✓ Dashboard title present")
        except Exception as e:
            print(f"✗ Dashboard page error: {e}")
        
        print("\nTesting Tenders List Page...")
        try:
            page.goto('http://localhost:3002/ar/tenders-list', wait_until='networkidle')
            page.wait_for_timeout(2000)
            page.screenshot(path='screenshots/tenders-list-page.png', full_page=True)
            print("✓ Tenders list page loaded successfully")
            
            # Check for key elements
            if page.locator('text=ETMAM').count() > 0:
                print("  ✓ Logo present")
            if page.locator('input[placeholder*="بحث"]').count() > 0 or page.locator('input[placeholder*="Search"]').count() > 0:
                print("  ✓ Search field present")
        except Exception as e:
            print(f"✗ Tenders list page error: {e}")
        
        # Report errors
        if errors:
            print("\n⚠ Console Errors Found:")
            for err in errors[:10]:  # Limit to first 10 errors
                print(f"  - {err}")
        else:
            print("\n✓ No console errors detected")
        
        browser.close()
        return len(errors) == 0

if __name__ == '__main__':
    success = test_pages()
    sys.exit(0 if success else 1)
