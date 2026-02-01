# GitHub Actions Secrets Setup Guide

This guide explains how to configure the required secrets for the Etimad scraper GitHub Actions workflow.

## Required Secrets

The scraper workflow needs these secrets to run:

1. **`SCRAPER_API_URL`** - The full URL to your sync endpoint
2. **`CRON_SECRET`** - Authentication token (must match your `.env.local`)
3. **`SLACK_WEBHOOK_URL`** (optional) - For failure notifications

---

## Step-by-Step Setup

### 1. Get Your Deployment URL

First, you need to know where your app is deployed. The sync endpoint will be:

```
https://YOUR-DOMAIN/api/cron/sync
```

**Examples:**
- **Vercel:** `https://your-app.vercel.app/api/cron/sync`
- **Netlify:** `https://your-app.netlify.app/api/cron/sync`
- **Custom domain:** `https://etmam.com/api/cron/sync`
- **Local testing:** `http://localhost:3000/api/cron/sync` (not for production!)

### 2. Get Your CRON_SECRET

Your `CRON_SECRET` is already set in `.env.local`. Copy it:

```bash
# In your .env.local file, you should see:
CRON_SECRET=c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966
```

**⚠️ Important:** 
- This secret must match exactly between your `.env.local` and GitHub secrets
- If you change it in one place, update the other
- Never commit this to git (it's already in `.gitignore`)

### 3. Add Secrets to GitHub

1. **Go to your GitHub repository**
2. **Navigate to:** Settings → Secrets and variables → Actions
3. **Click:** "New repository secret"

#### Add `SCRAPER_API_URL`:

- **Name:** `SCRAPER_API_URL`
- **Value:** Your full sync endpoint URL
  - Example: `https://etmam-crm.vercel.app/api/cron/sync`

#### Add `CRON_SECRET`:

- **Name:** `CRON_SECRET`
- **Value:** Copy from your `.env.local` file
  - Example: `c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966`

#### Add `SLACK_WEBHOOK_URL` (Optional):

- **Name:** `SLACK_WEBHOOK_URL`
- **Value:** Your Slack webhook URL
  - Example: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

---

## Verification

### Test Locally First

Before setting up GitHub Actions, test the scraper locally:

```powershell
# Set environment variables
$env:API_URL="http://localhost:3000/api/cron/sync"
$env:CRON_SECRET="c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966"

# Run scraper
pnpm scrape:run
```

### Test the Sync Endpoint

You can test the sync endpoint directly:

```powershell
# Test with curl (PowerShell)
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

Invoke-RestMethod -Uri "http://localhost:3000/api/cron/sync" -Method POST -Headers $headers -Body $body
```

### Test GitHub Actions Workflow

1. **Go to:** Actions tab in your GitHub repository
2. **Select:** "Etimad Scraper" workflow
3. **Click:** "Run workflow" → "Run workflow" (manual trigger)
4. **Watch:** The workflow should run and scrape tenders

---

## Troubleshooting

### Error: "API_URL environment variable is required"

**Problem:** `SCRAPER_API_URL` secret is not set or has wrong name.

**Solution:**
- Check secret name is exactly `SCRAPER_API_URL` (case-sensitive)
- Verify the URL is correct and accessible

### Error: "CRON_SECRET environment variable is required"

**Problem:** `CRON_SECRET` secret is not set.

**Solution:**
- Add the secret with exact name `CRON_SECRET`
- Copy the value from your `.env.local` file

### Error: "Unauthorized" (401) from sync endpoint

**Problem:** `CRON_SECRET` doesn't match between GitHub and your app.

**Solution:**
- Verify both values are identical
- Check for extra spaces or newlines
- Regenerate if needed: `openssl rand -hex 32`

### Error: "Failed to fetch" or network errors

**Problem:** The deployment URL is incorrect or not accessible.

**Solution:**
- Verify the URL is correct
- Check if your app is deployed and running
- Test the endpoint manually with curl/Postman

### Workflow runs but no tenders appear

**Problem:** Scraper might be blocked or no tenders match filters.

**Solution:**
- Check workflow logs for errors
- Verify activity filters are correct
- Check if Etimad website structure changed

---

## Security Best Practices

1. **Never commit secrets to git**
   - ✅ Already in `.gitignore`
   - ✅ Use GitHub Secrets for CI/CD

2. **Rotate secrets periodically**
   - Generate new `CRON_SECRET` every 90 days
   - Update both `.env.local` and GitHub Secrets

3. **Use different secrets per environment**
   - Development: Local `.env.local`
   - Production: GitHub Secrets
   - Staging: Separate GitHub repository or environment

4. **Monitor secret usage**
   - Check GitHub Actions logs regularly
   - Set up alerts for failed authentication

---

## Quick Reference

### Secret Names (Exact Match Required)

```
SCRAPER_API_URL
CRON_SECRET
SLACK_WEBHOOK_URL  (optional)
```

### Current Values (from .env.local)

```env
CRON_SECRET=c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966
```

### Example URLs

```
# Vercel
https://your-app.vercel.app/api/cron/sync

# Netlify
https://your-app.netlify.app/api/cron/sync

# Custom Domain
https://etmam.com/api/cron/sync
```

---

## Next Steps

After setting up secrets:

1. ✅ Test locally first
2. ✅ Deploy your app to production
3. ✅ Add secrets to GitHub
4. ✅ Test workflow manually
5. ✅ Monitor first scheduled run (6 AM UTC daily)

The workflow will automatically run daily at 6:00 AM UTC (9:00 AM Saudi Arabia time).
