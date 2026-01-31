# Scraper Testing Readiness Checklist

**Date:** 2026-01-27  
**Status:** ✅ **READY FOR TESTING** (with prerequisites)

## ✅ Completed Components

### 1. Database Schema ✅
- ✅ **Migration 00001:** Initial schema with all tables, indexes, RLS policies
- ✅ **Migration 00003:** Scraper support (unique constraint, indexes)
- ✅ **Syntax validation:** All migrations validated and ready
- ✅ **GIN indexes:** All JSONB columns properly indexed
- ✅ **Idempotent constraints:** Safe to run multiple times

### 2. Scraper Implementation ✅
- ✅ **Core scraper:** `lib/scraper/etimad-browser.ts` - Full implementation
- ✅ **Configuration:** `lib/scraper/config.ts` - Selectors, URLs, filters
- ✅ **Utilities:** `lib/scraper/utils.ts` - Parsing, retry logic
- ✅ **Error handling:** `lib/scraper/errors.ts` - Comprehensive error types
- ✅ **Test script:** `scripts/test-scraper.ts` - Ready for testing
- ✅ **Production script:** `scripts/run-scraper.ts` - Ready for CI/CD

### 3. API Endpoint ✅
- ✅ **Sync endpoint:** `app/api/cron/sync/route.ts` - Fully implemented
- ✅ **Authentication:** CRON_SECRET verification
- ✅ **Upsert logic:** Handles duplicate tenders correctly
- ✅ **Error handling:** Comprehensive error responses

### 4. Environment Configuration ✅
- ✅ **Supabase credentials:** Configured in `.env.local`
- ✅ **CRON_SECRET:** Set and ready
- ✅ **SYSTEM_USER_ID:** Configured
- ✅ **Playwright:** Installed as dev dependency

## ⚠️ Prerequisites Before Testing

### 1. Database Setup (REQUIRED)
```bash
# Run migrations against your Supabase database
# Option 1: Via Supabase CLI (if installed)
supabase db push

# Option 2: Via Supabase Dashboard
# - Go to SQL Editor
# - Run migrations in order:
#   1. 00001_initial_schema.sql
#   2. 00002_grant_api_permissions.sql
#   3. 00003_add_scraper_support.sql
#   4. 00004_add_oracle_schema.sql (if needed)
```

### 2. System User Creation (REQUIRED)
The scraper needs a system user in Supabase Auth. You have two options:

**Option A: Create via Supabase Dashboard**
1. Go to Authentication → Users
2. Create user with:
   - Email: `system@etmam.local`
   - ID: `00000000-0000-0000-0000-000000000001`
   - Password: (generate secure password, won't be used)

**Option B: Use Service Role (Recommended for testing)**
- The API endpoint uses `createServiceClient()` which bypasses RLS
- System user ID is only used for `user_id` field in tenders
- For testing, you can skip creating the auth user if using service role

### 3. Playwright Browsers (REQUIRED)
```bash
# Install Playwright browsers
npx playwright install chromium
```

### 4. Development Server (OPTIONAL - for API testing)
```bash
# Start Next.js dev server if testing with API
pnpm dev
# Server will run on http://localhost:3000
```

## 🧪 Testing Options

### Option 1: Test Scraper Only (No API)
**Best for:** Testing scraper functionality without database

```bash
# Run test scraper (scrapes 5 tenders, outputs to console)
pnpm scrape:test
```

**What it does:**
- Scrapes 5 tenders from Etimad
- Outputs results to console
- Does NOT save to database
- Fast (3-5 minutes)

**Expected output:**
```
============================================================
ETIMAD SCRAPER - TEST MODE
============================================================

[Test] Starting scraper with batch size: 5
[Test] Activity filter: 9 (Telecom/IT)

--- Sample Tender ---
  Reference: 1234567890
  Title: منافسة لتوريد...
  Entity: وزارة...
  Deadline: 2026-02-15T00:00:00.000Z
  ...
```

### Option 2: Test Scraper + API (Full Integration)
**Best for:** End-to-end testing with database

**Step 1: Start dev server**
```bash
# Terminal 1
pnpm dev
```

**Step 2: Run scraper with API**
```bash
# Terminal 2
POST_TO_API=true API_URL=http://localhost:3000/api/cron/sync CRON_SECRET=c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966 pnpm scrape:test
```

**What it does:**
- Scrapes 5 tenders
- POSTs to API endpoint
- Upserts into Supabase database
- Returns sync results

**Expected output:**
```
--- API Response ---
  Status: 200
  Success: true
  Upserted: 5
```

### Option 3: Production Test (Full Batch)
**Best for:** Testing production-like scenario

```bash
# Set environment variables
export API_URL=http://localhost:3000/api/cron/sync
export CRON_SECRET=c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966
export BATCH_SIZE=50
export DELAY_MS=2000

# Run production script
pnpm scrape:run
```

## 🔍 Verification Steps

After running the scraper, verify:

### 1. Check Database
```sql
-- Check if tenders were created
SELECT 
  reference_no,
  title,
  entity,
  deadline,
  source,
  created_at
FROM tenders
WHERE source = 'etimad'
ORDER BY created_at DESC
LIMIT 10;

-- Check raw_data JSONB
SELECT 
  reference_no,
  raw_data->>'scraped_at' as scraped_at,
  raw_data->>'tender_url' as tender_url,
  raw_data->>'booklet_price' as booklet_price
FROM tenders
WHERE source = 'etimad'
LIMIT 5;
```

### 2. Check API Logs
- Look for `[Sync API]` logs in Next.js console
- Verify `upserted` count matches scraped count
- Check for any error messages

### 3. Check Scraper Logs
- Verify scraping completed successfully
- Check for any navigation errors
- Verify all 5 tenders were scraped

## 🐛 Troubleshooting

### Issue: "Playwright browsers not found"
```bash
npx playwright install chromium
```

### Issue: "CRON_SECRET not configured"
- Check `.env.local` has `CRON_SECRET` set
- Restart dev server after adding env vars

### Issue: "Database connection failed"
- Verify Supabase credentials in `.env.local`
- Check migrations have been run
- Verify service role key is correct

### Issue: "Unauthorized" from API
- Verify `CRON_SECRET` matches in both `.env.local` and command
- Check Authorization header format: `Bearer <token>`

### Issue: "System user not found"
- For testing, this is OK if using service role
- The API uses service role which bypasses RLS
- System user ID is just stored in `user_id` field

### Issue: "Scraper timeout"
- Etimad portal may be slow
- Increase `DELAY_MS` in test script
- Check network connection

## 📊 Success Criteria

✅ **Scraper is ready if:**
1. ✅ All migrations are applied
2. ✅ Playwright browsers are installed
3. ✅ Environment variables are set
4. ✅ Test scraper runs without errors
5. ✅ Tenders appear in database (if using API)
6. ✅ API returns success response

## 🚀 Next Steps After Testing

1. **Verify data quality:**
   - Check scraped fields are complete
   - Verify Arabic text encoding
   - Check date parsing

2. **Test error handling:**
   - Test with invalid reference numbers
   - Test with network failures
   - Test rate limiting

3. **Set up GitHub Actions:**
   - Configure workflow file
   - Add secrets to GitHub
   - Test scheduled runs

4. **Monitor production:**
   - Set up error tracking
   - Monitor scraping success rate
   - Track database growth

---

## Quick Start Command

```bash
# 1. Install Playwright browsers
npx playwright install chromium

# 2. Test scraper only (no database)
pnpm scrape:test

# 3. Test with API (requires pnpm dev running)
# Terminal 1:
pnpm dev

# Terminal 2:
POST_TO_API=true API_URL=http://localhost:3000/api/cron/sync CRON_SECRET=c3e13fc9c353f5df3e6a251479ce621889f829d34b05ae63216cac604927e966 pnpm scrape:test
```

**Status: ✅ READY TO TEST**
