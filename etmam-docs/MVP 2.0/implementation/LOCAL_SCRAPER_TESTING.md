# Local Scraper Testing Guide
## Testing the Scraper Before Deployment

Since you haven't deployed yet, you can test the scraper locally. Here's how:

---

## 🧪 Option 1: Test Scraper Only (No API Sync)

Test the scraper without syncing to the API:

```powershell
# Just run the scraper to see if it works
pnpm scrape:test
```

This will:
- ✅ Scrape tenders from Etimad
- ✅ Show you the results
- ❌ NOT sync to database (no API call)

---

## 🧪 Option 2: Test Locally with Local API

Test the full flow with your local development server:

### Step 1: Start Your Local Server

```powershell
# Terminal 1: Start Next.js dev server
pnpm dev
```

Your API will be available at: `http://localhost:3000/api/cron/sync`

### Step 2: Run Scraper with Local API

```powershell
# Terminal 2: Run scraper pointing to local API
$env:API_URL="http://localhost:3000/api/cron/sync"
$env:CRON_SECRET="c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966"
pnpm scrape:run
```

This will:
- ✅ Scrape tenders from Etimad
- ✅ POST to your local API
- ✅ Sync to your local Supabase database

---

## 🧪 Option 3: Test Scraper + Save to File (No API)

If you want to see what the scraper collects without using the API:

```powershell
# Run the scraper test script
pnpm scrape:test
```

This saves results to files you can inspect.

---

## 📝 Current Status

### ✅ What Works Now:
- Scraper code is ready
- Local testing works
- API endpoint exists (`/api/cron/sync`)
- Database schema is ready

### ⏳ What to Do Later (When Deployed):
1. Deploy your app (Vercel/Netlify/etc.)
2. Get your deployment URL
3. Add GitHub Secrets:
   - `SCRAPER_API_URL` = `https://your-app.vercel.app/api/cron/sync`
   - `CRON_SECRET` = (same as in `.env.local`)
4. Uncomment the schedule in `.github/workflows/scraper.yml`
5. Test GitHub Actions workflow manually

---

## 🚀 When You're Ready to Deploy

### Step 1: Deploy Your App

Deploy to Vercel, Netlify, or your preferred platform.

**Example with Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Step 2: Get Your Deployment URL

After deployment, you'll get a URL like:
- `https://etmaam-crm.vercel.app`
- Or your custom domain

### Step 3: Test the Sync Endpoint

Test that your deployed API works:

```powershell
# Test the endpoint (replace with your actual URL)
$headers = @{
    "Authorization" = "Bearer c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966"
    "Content-Type" = "application/json"
}

$body = @{
    tenders = @(
        @{
            reference_no = "TEST-001"
            title = "Test Tender"
            entity = "Test Entity"
            deadline = "2025-12-31T00:00:00Z"
            estimated_value = 100000
            source = "etimad"
            scraped_at = (Get-Date).ToUniversalTime().ToString("o")
        }
    )
    metadata = @{
        startedAt = (Get-Date).ToUniversalTime().ToString("o")
        completedAt = (Get-Date).ToUniversalTime().ToString("o")
        totalScraped = 1
        totalErrors = 0
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://your-app.vercel.app/api/cron/sync" -Method POST -Headers $headers -Body $body
```

### Step 4: Add GitHub Secrets

1. Go to: GitHub → Your Repo → Settings → Secrets and variables → Actions
2. Add:
   - **Name:** `SCRAPER_API_URL`
   - **Value:** `https://your-app.vercel.app/api/cron/sync`
3. Add:
   - **Name:** `CRON_SECRET`
   - **Value:** `c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966`

### Step 5: Enable Scheduled Runs

Edit `.github/workflows/scraper.yml`:

```yaml
on:
  schedule:
    # Run daily at 6:00 AM UTC (9 AM Saudi Arabia time)
    - cron: '0 6 * * *'

  workflow_dispatch:
    # ... rest of config
```

### Step 6: Test GitHub Actions

1. Go to: Actions tab
2. Select "Etimad Scraper" workflow
3. Click "Run workflow" → "Run workflow"
4. Watch it run!

---

## 🎯 Summary: What to Do Now vs Later

### ✅ Do Now (While Building):
- Test scraper locally: `pnpm scrape:test`
- Test with local API: `pnpm dev` + `pnpm scrape:run` (with local API_URL)
- Build and test your app
- Don't worry about GitHub Actions yet

### ⏳ Do Later (When Deployed):
- Deploy your app
- Get deployment URL
- Add GitHub Secrets
- Enable scheduled runs
- Test GitHub Actions workflow

---

## 🔧 Quick Local Test Script

Create a simple test script to verify everything works:

```powershell
# test-scraper-local.ps1
Write-Host "Starting local scraper test..." -ForegroundColor Green

# Check if dev server is running
$response = try {
    Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing
} catch {
    $null
}

if (-not $response) {
    Write-Host "⚠️  Dev server not running. Start it with: pnpm dev" -ForegroundColor Yellow
    Write-Host "Opening in new terminal..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm dev"
    Start-Sleep -Seconds 5
}

# Set environment variables
$env:API_URL = "http://localhost:3000/api/cron/sync"
$env:CRON_SECRET = "c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966"
$env:BATCH_SIZE = "5"  # Small batch for testing

Write-Host "Running scraper..." -ForegroundColor Green
pnpm scrape:run
```

Save as `scripts/test-scraper-local.ps1` and run:
```powershell
.\scripts\test-scraper-local.ps1
```

---

## ❓ FAQ

**Q: Can I test GitHub Actions before deploying?**  
A: No, GitHub Actions needs a real deployment URL. Test locally first.

**Q: What if I want to test the scraper without the API?**  
A: Use `pnpm scrape:test` - it just scrapes and shows results.

**Q: When should I set up GitHub Actions?**  
A: After you've deployed and verified the API endpoint works.

**Q: Can I disable the scheduled runs?**  
A: Yes, they're already disabled (commented out). Uncomment when ready.

---

**Bottom line:** Focus on building and testing locally. Set up GitHub Actions after deployment. The workflow is ready, just needs your deployment URL! 🚀
