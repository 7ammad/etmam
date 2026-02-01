# Deployment Roadmap
## Step-by-Step Guide: From Development to Production

This guide walks you through deploying Etmaam and setting up automated scraping.

---

## 🎯 Current Status

### ✅ What's Ready:
- ✅ Application code complete
- ✅ Scraper code complete
- ✅ API endpoint ready (`/api/cron/sync`)
- ✅ Database schema ready
- ✅ GitHub Actions workflow ready (disabled until deployment)

### ⏳ What's Next:
- ⏳ Deploy application
- ⏳ Set up GitHub Actions secrets
- ⏳ Enable scheduled scraping

---

## 📋 Phase 1: Local Testing (Do This First)

Before deploying, make sure everything works locally:

### 1. Test the Application

```powershell
# Start dev server
pnpm dev

# Visit: http://localhost:3000
# Test all features:
# - Login/authentication
# - Dashboard
# - Tender upload
# - Tender evaluation
# - CRM settings
```

### 2. Test the Scraper Locally

```powershell
# Option A: Test scraper only (no API)
pnpm scrape:test

# Option B: Test scraper + local API
# Terminal 1:
pnpm dev

# Terminal 2:
$env:API_URL="http://localhost:3000/api/cron/sync"
$env:CRON_SECRET="c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966"
pnpm scrape:run
```

### 3. Verify Database

Check that scraped tenders appear in your Supabase database:
- Go to Supabase Dashboard
- Check `tenders` table
- Verify data is correct

---

## 🚀 Phase 2: Deploy Application

### Option A: Deploy to Vercel (Recommended)

**Why Vercel:**
- ✅ Best Next.js support
- ✅ Easy deployment
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Environment variables management

**Steps:**

1. **Install Vercel CLI:**
   ```powershell
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```powershell
   vercel login
   ```

3. **Deploy:**
   ```powershell
   # From project root
   vercel
   
   # Follow prompts:
   # - Link to existing project? No (first time)
   # - Project name: etmaam-crm (or your choice)
   # - Directory: ./
   # - Override settings? No
   ```

4. **Add Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `DEEPSEEK_API_KEY`
     - `AI_PROVIDER`
     - `CRON_SECRET`
     - `SYSTEM_USER_ID`

5. **Redeploy:**
   ```powershell
   vercel --prod
   ```

6. **Get Your URL:**
   - You'll get: `https://etmaam-crm.vercel.app`
   - Or set up custom domain in Vercel settings

---

### Option B: Deploy to Netlify

**Steps:**

1. **Install Netlify CLI:**
   ```powershell
   npm i -g netlify-cli
   ```

2. **Login:**
   ```powershell
   netlify login
   ```

3. **Deploy:**
   ```powershell
   # Build first
   pnpm build
   
   # Deploy
   netlify deploy --prod
   ```

4. **Add Environment Variables:**
   - Netlify Dashboard → Site settings → Environment variables
   - Add all from `.env.local`

---

### Option C: Other Platforms

**Railway, Render, Fly.io, etc.**
- Follow platform-specific Next.js deployment guides
- Add all environment variables
- Ensure Node.js 20+ is available

---

## ✅ Phase 3: Verify Deployment

### 1. Test Your Deployed App

Visit your deployment URL and test:
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard loads
- [ ] All features work

### 2. Test the Sync API Endpoint

```powershell
# Test the endpoint (replace with your URL)
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

$response = Invoke-RestMethod -Uri "https://your-app.vercel.app/api/cron/sync" -Method POST -Headers $headers -Body $body
$response
```

**Expected response:**
```json
{
  "success": true,
  "upserted": 1,
  "errors": []
}
```

### 3. Verify in Database

Check Supabase to confirm the test tender was created.

---

## 🔧 Phase 4: Set Up GitHub Actions

### Step 1: Add GitHub Secrets

1. Go to: **GitHub → Your Repo → Settings → Secrets and variables → Actions**

2. Click: **"New repository secret"**

3. Add these secrets:

   **Secret 1: SCRAPER_API_URL**
   - Name: `SCRAPER_API_URL`
   - Value: `https://your-app.vercel.app/api/cron/sync`
   - (Replace with your actual deployment URL)

   **Secret 2: CRON_SECRET**
   - Name: `CRON_SECRET`
   - Value: `c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966`
   - (Same as in your `.env.local`)

   **Secret 3: SLACK_WEBHOOK_URL** (Optional)
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Your Slack webhook URL

### Step 2: Enable Scheduled Runs

Edit `.github/workflows/scraper.yml`:

```yaml
on:
  schedule:
    # Run daily at 6:00 AM UTC (9 AM Saudi Arabia time)
    - cron: '0 6 * * *'

  workflow_dispatch:
    # ... rest stays the same
```

Remove the comment that says "NOTE: Scheduled runs are disabled..."

### Step 3: Test GitHub Actions

1. Go to: **Actions tab** in GitHub
2. Select: **"Etimad Scraper"** workflow
3. Click: **"Run workflow"** → **"Run workflow"**
4. Watch it run!

**What to check:**
- ✅ Workflow starts
- ✅ Scraper runs successfully
- ✅ API call succeeds
- ✅ Tenders appear in database

---

## 📊 Phase 5: Monitor & Maintain

### Daily Checks (First Week)

- [ ] Check GitHub Actions runs (should run at 6 AM UTC)
- [ ] Verify tenders appear in database
- [ ] Check for errors in workflow logs
- [ ] Monitor API endpoint health

### Weekly Checks

- [ ] Review scraper logs
- [ ] Check for failed runs
- [ ] Verify data quality
- [ ] Update if Etimad website changes

### Monthly Checks

- [ ] Review scraper performance
- [ ] Check API usage/limits
- [ ] Update dependencies if needed
- [ ] Review and optimize

---

## 🚨 Troubleshooting

### Issue: GitHub Actions fails with "API_URL required"

**Solution:**
- Check that `SCRAPER_API_URL` secret is set
- Verify the URL is correct (no trailing slash)
- Test the URL manually with curl/Postman

### Issue: "Unauthorized" (401) from API

**Solution:**
- Verify `CRON_SECRET` matches in both places
- Check for extra spaces/newlines in secret
- Regenerate secret if needed: `openssl rand -hex 32`

### Issue: Scraper runs but no tenders in database

**Solution:**
- Check Supabase logs
- Verify `SYSTEM_USER_ID` user exists
- Check RLS policies
- Verify API endpoint is working

### Issue: Deployment fails

**Solution:**
- Check build logs
- Verify all environment variables are set
- Ensure Node.js version is correct (20+)
- Check for TypeScript errors: `pnpm type-check`

---

## ✅ Deployment Checklist

Before considering deployment complete:

- [ ] Application deployed and accessible
- [ ] All environment variables set
- [ ] Sync API endpoint tested and working
- [ ] GitHub Actions secrets added
- [ ] Scheduled runs enabled
- [ ] First manual workflow run successful
- [ ] Tenders appearing in database
- [ ] Monitoring set up (optional)

---

## 🎯 Quick Reference

### Local Testing
```powershell
pnpm scrape:test              # Test scraper only
pnpm scrape:run               # Test with local API
```

### Deployment
```powershell
vercel                        # Deploy to Vercel
vercel --prod                 # Production deploy
```

### GitHub Actions
- Secrets: `SCRAPER_API_URL`, `CRON_SECRET`
- Workflow: `.github/workflows/scraper.yml`
- Schedule: Daily at 6 AM UTC

---

## 📚 Related Documentation

- [Local Scraper Testing](LOCAL_SCRAPER_TESTING.md) - Test before deployment
- [GitHub Actions Setup](GITHUB_ACTIONS_SETUP.md) - Detailed CI/CD guide
- [Handover Guide](HANDOVER_GUIDE.md) - Client handover process

---

**Remember:** Test locally first, deploy second, automate third! 🚀
