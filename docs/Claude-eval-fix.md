This is fantastic! You have 94 historical tenders with actual award amounts. Now I can see the complete picture.

The Problem is Clear Now
What Your Historical Data Shows:
By Service Type (from titles):

Service Type	Tenders	Median Award	IQR Range
Software (تطوير/برمجة/نظام)	31	41.8M	6.9M–145M
Procurement (توريد/شراء)	21	4.6M	1.6M–9M
Maintenance (صيانة/تشغيل)	11	199.9M	6.3M–289M
Security (أمن سيبراني)	4	265.9M	9.6M–266M
Consulting (استشارات)	2	9.2M	–
Training (تدريب)	2	8M	–
By Entity Type:

Entity	Tenders	Median Award	IQR Range
Authority (هيئة)	10	61.9M	9.6M–79M
Ministry	25	6.1M	3.1M–10M
Healthcare	4	1.2M	0.7M–1.2M
The Current Logic is Broken Because:
"Subscription renewal for HR Platform" gets booklet tier >50K → estimates 170M midpoint

Reality: Renewals/subscriptions are typically 0.5M–5M based on historical data
"Quality control testing services" gets booklet tier 5K-50K → estimates ~8M

But this is a consulting/services tender, median should be closer to 5-10M (reasonable, actually)
Current logic ignores:

نوع المنافسة (tender type) - Direct purchase has legal cap of 500K SAR!
مجال التصنيف (classification) - Shows it's an IT/Telecom tender
مدة العقد (contract duration) - 24 months vs 30 days = huge value difference
طريقة تقديم العروض (submission method) - Separate files = larger/complex tender
My Proposed Solution: Complete Evaluation Overhaul
New Evaluation Architecture:

┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CLASSIFY TENDER                                        │
├─────────────────────────────────────────────────────────────────┤
│  • Service Type → from title keywords (software/procurement/etc)│
│  • Tender Type → شراء مباشر (≤500K) / منافسة عامة / محدودة     │
│  • Entity Category → ministry/authority/healthcare/education    │
│  • Complexity → from submission method, guarantees, insurance   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: SERVICE-AWARE VALUE ESTIMATION                         │
├─────────────────────────────────────────────────────────────────┤
│  • Use HISTORICAL calibration by service type (not just booklet)│
│  • Apply tender-type constraints (direct purchase ≤ 500K SAR)   │
│  • Consider contract duration (24 months >> 30 days)            │
│  • Entity-specific adjustment                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: MULTI-DIMENSIONAL SCORING                              │
├─────────────────────────────────────────────────────────────────┤
│  SERVICE_FIT (25%)  │ Does tender match company capabilities?   │
│  BUDGET_FIT (20%)   │ Is value in your target range?            │
│  TIMELINE_FIT (20%) │ Enough prep time?                         │
│  COMPLEXITY_FIT(15%)│ Right complexity for your team?           │
│  STRATEGIC_FIT(10%) │ Entity relationship + geography           │
│  RISK_SCORE (10%)   │ Missing fields, short timeline            │
└─────────────────────────────────────────────────────────────────┘
New Service Fit Dimension (THE BIG MISSING PIECE)
This dimension answers: "Should your company even bid on this?"


// Example service categories for Etmam (IT/Telecom company)
const COMPANY_SERVICES = {
  core: [
    { pattern: 'تطوير|برمجة|منصة|نظام|تطبيق', fit: 100, label: 'software_dev' },
    { pattern: 'أمن سيبراني|حماية', fit: 100, label: 'cybersecurity' },
    { pattern: 'تكامل|ربط|API', fit: 95, label: 'integration' },
  ],
  adjacent: [
    { pattern: 'توريد.*أجهزة|معدات.*تقنية', fit: 70, label: 'it_hardware' },
    { pattern: 'تجديد.*رخص|اشتراك', fit: 60, label: 'license_renewal' },
    { pattern: 'تشغيل.*صيانة', fit: 50, label: 'managed_services' },
  ],
  avoid: [
    { pattern: 'نظافة|تنظيف', fit: 0, label: 'cleaning' },
    { pattern: 'مركبات|سيارات', fit: 0, label: 'vehicles' },
    { pattern: 'طباعة|أحبار', fit: 10, label: 'printing' },
  ]
}
Smart Value Estimation Using Historical Data
Instead of crude booklet tiers:


function estimateValueV2(tender: ScrapedTender, historical: CalibrationData): ValueEstimate {
  // 1. Check tender type constraint FIRST
  const tenderType = tender.tab_sections?.basic_info?.['نوع المنافسة']
  if (tenderType === 'شراء مباشر') {
    return { max: 500000, confidence: 95, reason: 'Direct purchase legal limit' }
  }

  // 2. Get service-type-specific calibration
  const serviceType = classifyServiceType(tender.title)
  const serviceStats = historical.title_categories.find(c => c.label === serviceType)
  
  // 3. Apply entity adjustment
  const entityType = classifyEntity(tender.entity)
  const entityStats = historical.entity_categories.find(c => c.label === entityType)
  
  // 4. Consider contract duration
  const duration = parseContractDuration(tender.contract_duration)
  const durationMultiplier = duration > 12 ? 1.5 : duration > 6 ? 1.2 : 1.0

  // 5. Return calibrated estimate using IQR (p25-p75) from historical
  return {
    min: serviceStats.p25 * durationMultiplier,
    max: serviceStats.p75 * durationMultiplier,
    midpoint: serviceStats.median * durationMultiplier,
    confidence: 85,
    method: 'historical_calibration'
  }
}
Want Me to Implement This?
I can build this complete overhaul:

New classifyTender() function - Extracts service type, tender type, entity category from tab_sections
New estimateValueV2() function - Uses historical calibration + service-type awareness
New SERVICE_FIT scoring dimension - Configurable company service matching
Updated scoreTender() function - New 6-dimension scoring with proper weights
Company services config - Define what Etmam actually provides (you customize this)
The end result: A tender like "Subscription renewal for HR Platform" would:

Be classified as license_renewal (service type)
Get realistic estimate of 2-5M SAR (from historical renewals data)
Score lower on SERVICE_FIT if you don't do license reselling
Not get a crazy 170M estimate
Should I proceed with implementation?