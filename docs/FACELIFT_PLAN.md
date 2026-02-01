# Etmam Dashboard & Tender Page Facelift Plan

**Created:** 2026-02-01
**For:** Cursor Implementation
**Scope:** Evaluation Language Fix + Complete UI Facelift

---

## Part 1: Fix Evaluation Language (Arabic Output)

### Problem
The evaluation reasoning (summary, strengths, risks, etc.) displays in English despite the Arabic UI. The AI prompt in `lib/ai/prompts.ts` already instructs Arabic output, but the model (DeepSeek/OpenAI) isn't reliably complying.

### Solution: Multi-Layer Arabic Enforcement

#### 1.1 Strengthen the Prompt (`lib/ai/prompts.ts`)

**File:** `lib/ai/prompts.ts` (lines 105-117)

Replace `EVALUATOR_SYSTEM_PROMPT` with a more forceful version:

```typescript
export const EVALUATOR_SYSTEM_PROMPT = `[LANGUAGE: ARABIC ONLY - هذا إلزامي]

أنت خبير تقييم منافسات حكومية سعودية.

⚠️ تعليمات اللغة الإلزامية ⚠️
كل النصوص في الإخراج يجب أن تكون باللغة العربية فقط.
ممنوع منعاً باتاً استخدام أي كلمة إنجليزية.
إذا كتبت أي نص بالإنجليزية، سيتم رفض الإخراج.

قواعد التقييم:
1. احسب أولاً breakdown (خمس أعداد صحيحة 0–100): budget_fit, technical_fit, timeline_fit, strategic_fit, risk_score.
2. score = متوسط الخمسة (جمعهم ÷ 5)، تقريب لأقرب عدد صحيح.
3. recommendation من score فقط: qualified إذا >= 70، conditional إذا 40–69، excluded إذا < 40.
4. أرجع JSON فقط بدون أي نص قبله أو بعده.

مثال على الإخراج المطلوب (بالعربية فقط):
{
  "summary": "منافسة واعدة في قطاع التقنية مع متطلبات واضحة",
  "strengths": ["خبرة سابقة مع الجهة", "المتطلبات الفنية متوافقة"],
  "risks": ["المدة الزمنية قصيرة", "المنافسة عالية"],
  "missing_requirements": ["شهادة ISO غير متوفرة"],
  "action_items": ["مراجعة الكراسة", "تجهيز فريق العمل"]
}`
```

#### 1.2 Add Post-Processing Validation (`lib/ai/evaluator.ts`)

Add a language detection check after receiving the AI response:

```typescript
// Add this helper function
function isArabicText(text: string): boolean {
  // Arabic Unicode range
  const arabicPattern = /[\u0600-\u06FF]/;
  // Check if at least 30% of characters are Arabic
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return arabicChars / text.length > 0.3;
}

function validateArabicOutput(evaluation: EvaluationResponse): boolean {
  const textsToCheck = [
    evaluation.summary,
    ...(evaluation.strengths || []),
    ...(evaluation.risks || []),
    ...(evaluation.missing_requirements || []),
    ...(evaluation.action_items || []),
  ].filter(Boolean);

  return textsToCheck.every(text => isArabicText(text as string));
}

// In the evaluation function, add retry logic:
// If !validateArabicOutput(response), retry with stronger prompt or fallback
```

#### 1.3 Fallback Translation (Optional)

If the model consistently fails, add a translation step using the AI:

```typescript
async function translateToArabic(text: string): Promise<string> {
  // Use a simple translation prompt as fallback
  const result = await ai.generateText({
    model: 'gpt-4o-mini', // or cheaper model
    prompt: `ترجم النص التالي إلى العربية بشكل احترافي:\n\n${text}`,
  });
  return result.text;
}
```

---

## Part 2: Dashboard List Page Facelift

### Current Issues
1. KPI cards are plain and lack visual hierarchy
2. Filters row is cramped with no visual grouping
3. Table has minimal styling
4. Chart is disconnected from the content
5. Actions row lacks visual prominence

### 2.1 New Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER BAR (existing)                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  PAGE TITLE + SUBTITLE                              ACTIONS │ │
│  │  "لوحة التحكم"                              [Scrape] [Export]│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │TOTAL│ │QUAL │ │COND │ │EXCL │ │PEND │ │ 7D  │ │30D  │       │
│  │ 124 │ │  45 │ │  32 │ │  12 │ │  35 │ │  8  │ │  23 │       │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ FILTERS                                                     │ │
│  │ [🔍 Search...    ] [Recommendation ▼] [Deadline ▼] [Status ▼]│ │
│  │                                              [Sort ▼] [Clear]│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ BULK ACTIONS                                                │ │
│  │ ☑ Select All (10)  │  [✨ Evaluate Selected]  [Evaluate All]│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ TENDERS TABLE (elevated card with shadow)                   │ │
│  │ ┌───┬─────────┬──────────┬────────┬──────┬─────┬────┬────┐ │ │
│  │ │ ☑ │ Entity  │ Title    │ Ref    │ Date │Value│Scor│Rec │ │ │
│  │ ├───┼─────────┼──────────┼────────┼──────┼─────┼────┼────┤ │ │
│  │ │   │ ...     │ ...      │ ...    │ ...  │ ... │ ...│ ...│ │ │
│  │ └───┴─────────┴──────────┴────────┴──────┴─────┴────┴────┘ │ │
│  │                                                             │ │
│  │  Showing 1-10 of 124          [◀ Prev] [1] [2] [3] [Next ▶]│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ INSIGHTS (collapsible)                                      │ │
│  │ [Chart: Tenders by Deadline Window]                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 KPI Cards Redesign

**File:** `components/dashboard/dashboard-kpi-row.tsx`

```tsx
// New KPI Card Design
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  accent: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
}

function KpiCard({ icon, label, value, accent }: KpiCardProps) {
  return (
    <Card className="kpi-card" data-accent={accent}>
      <Flex gap="3" align="center">
        <Box className="kpi-icon-wrapper" data-accent={accent}>
          {icon}
        </Box>
        <Flex direction="column" gap="0">
          <Text className="kpi-value">{value.toLocaleString('ar-SA')}</Text>
          <Text className="kpi-label">{label}</Text>
        </Flex>
      </Flex>
    </Card>
  );
}
```

**CSS Tokens to Add (app/globals.css):**

```css
/* KPI Card Styles */
.kpi-card {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  padding: 16px 20px;
  border: 1px solid var(--border-default);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.kpi-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon-wrapper[data-accent="primary"] {
  background: var(--color-primary-100);
  color: var(--color-primary-600);
}

.kpi-icon-wrapper[data-accent="success"] {
  background: var(--color-qualified-bg);
  color: var(--color-qualified-text);
}

.kpi-icon-wrapper[data-accent="warning"] {
  background: var(--color-conditional-bg);
  color: var(--color-conditional-text);
}

.kpi-icon-wrapper[data-accent="danger"] {
  background: var(--color-excluded-bg);
  color: var(--color-excluded-text);
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  line-height: 1.2;
}

.kpi-label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}
```

### 2.3 Filters Section Redesign

**Changes to `components/dashboard/tenders-list-client.tsx`:**

1. Group filters in a subtle card container
2. Add visual separators between filter groups
3. Use icons in filter labels
4. Make search input more prominent

```tsx
// Filters section with better grouping
<Card className="filters-container">
  <Flex direction="column" gap="4">
    {/* Search Row - Full Width */}
    <TextField.Root
      size="3"
      className="search-input"
      placeholder={t('searchPlaceholder')}
      value={search}
      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
    >
      <TextField.Slot>
        <Search size={18} />
      </TextField.Slot>
    </TextField.Root>

    {/* Filters Row */}
    <Flex gap="3" wrap="wrap" align="center">
      <Flex gap="2" align="center" className="filter-group">
        <Filter size={14} className="filter-icon" />
        <Select.Root value={recommendationFilter || 'all'} ...>
          {/* ... */}
        </Select.Root>
        <Select.Root value={deadlineFilter || 'all'} ...>
          {/* ... */}
        </Select.Root>
        <Select.Root value={statusFilter || 'all'} ...>
          {/* ... */}
        </Select.Root>
      </Flex>

      <Box className="filter-divider" />

      <Flex gap="2" align="center" className="filter-group">
        <ArrowUpDown size={14} className="filter-icon" />
        <Select.Root value={sortKey} ...>
          {/* ... */}
        </Select.Root>
      </Flex>

      {hasActiveFilters && (
        <Button variant="ghost" size="2" onClick={clearAllFilters}>
          <X size={14} />
          {t('clearFilters')}
        </Button>
      )}
    </Flex>
  </Flex>
</Card>
```

**CSS:**

```css
.filters-container {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-card);
  padding: 16px;
}

.search-input {
  max-width: 400px;
}

.filter-group {
  padding: 4px 8px;
  background: var(--gray-a2);
  border-radius: 8px;
}

.filter-icon {
  color: var(--text-tertiary);
}

.filter-divider {
  width: 1px;
  height: 24px;
  background: var(--border-default);
  margin: 0 8px;
}
```

### 2.4 Table Redesign

**Changes to tenders table:**

1. Cleaner row styling with subtle alternating backgrounds
2. Better hover states
3. Score displayed with visual progress indicator
4. Recommendation badge with better contrast

```tsx
// Table row with enhanced styling
<Table.Row
  key={tender.id}
  className="tender-row"
  data-status={tender.status}
>
  {/* ... cells ... */}

  {/* Score Cell - Visual Enhancement */}
  <Table.Cell className="score-cell">
    <Flex align="center" gap="2">
      <Box
        className="score-indicator"
        style={{
          '--score-progress': `${tender.evaluation?.score || 0}%`,
          '--score-color': getScoreColor(tender.evaluation?.score)
        } as React.CSSProperties}
      />
      <Text className="score-value">
        {tender.evaluation ? formatScore(tender.evaluation.score) : '—'}
      </Text>
    </Flex>
  </Table.Cell>
</Table.Row>
```

**CSS:**

```css
.tender-row {
  transition: background-color 0.15s ease;
}

.tender-row:hover {
  background: var(--gray-a2);
}

.tender-row:nth-child(even) {
  background: var(--gray-a1);
}

.tender-row:nth-child(even):hover {
  background: var(--gray-a3);
}

.score-cell {
  min-width: 80px;
}

.score-indicator {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--score-color) var(--score-progress),
    var(--gray-a4) var(--score-progress)
  );
}

.score-value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
```

### 2.5 Bulk Actions Bar

**New floating action bar when items are selected:**

```tsx
{selectedIds.size > 0 && (
  <Card className="bulk-actions-bar">
    <Flex justify="between" align="center">
      <Flex gap="3" align="center">
        <Checkbox
          checked={pageItems.every(t => selectedIds.has(t.id))}
          onCheckedChange={(checked) => {
            if (checked) selectAllOnPage();
            else clearSelection();
          }}
        />
        <Text size="2" weight="medium">
          {t('selectedCount', { count: selectedIds.size })}
        </Text>
        <Button variant="ghost" size="1" onClick={clearSelection}>
          {t('clearSelection')}
        </Button>
      </Flex>

      <Flex gap="2">
        <Button
          size="2"
          disabled={evaluating}
          onClick={handleEvaluateSelected}
          className="evaluate-btn"
        >
          <Sparkles size={16} />
          {evaluateProgress
            ? t('evaluatingProgress', evaluateProgress)
            : t('evaluateSelected')}
        </Button>
      </Flex>
    </Flex>
  </Card>
)}
```

**CSS:**

```css
.bulk-actions-bar {
  position: sticky;
  top: 80px; /* Below header */
  z-index: 10;
  background: var(--surface-card);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-card);
  padding: 12px 16px;
  box-shadow: var(--shadow-card);
}

.evaluate-btn {
  background: var(--color-primary-500);
  color: white;
}

.evaluate-btn:hover:not(:disabled) {
  background: var(--color-primary-600);
}
```

---

## Part 3: Tender Detail Page Facelift

### Current Issues
1. Header is too plain
2. Score display lacks visual impact
3. Evaluation sections (strengths/risks) are basic lists
4. Cards are stacked vertically without visual hierarchy
5. "الدرجة 68" and "المخاطر" sections need better design (per screenshot)

### 3.1 New Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER BAR (existing)                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [← Back to Dashboard]                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ TENDER HEADER (Hero Section)                                │ │
│  │                                                             │ │
│  │  Ministry of Digital Affairs                                │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━                                │ │
│  │  توريد وتركيب نظام مراقبة ذكي                               │ │
│  │                                                             │ │
│  │  REF: 2024-MODA-1234    📅 28 يوم متبقي    💰 ~400K SAR    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────┐ ┌───────────────────────────────┐ │
│  │ التقييم                   │ │ تفاصيل التقييم                │ │
│  │                           │ │                               │ │
│  │    ╭─────────────╮       │ │ ━━ نقاط القوة                  │ │
│  │    │     68      │       │ │ • خبرة سابقة مع الجهة         │ │
│  │    │  ──────────│       │ │ • المتطلبات الفنية متوافقة    │ │
│  │    │ مؤهل بشروط  │       │ │                               │ │
│  │    ╰─────────────╯       │ │ ━━ المخاطر                    │ │
│  │                           │ │ • المدة الزمنية قصيرة         │ │
│  │  [إعادة تشغيل التحليل]    │ │ • المنافسة عالية              │ │
│  │                           │ │                               │ │
│  │  ━━━ تفصيل الدرجات        │ │ ━━ المتطلبات الناقصة          │ │
│  │  Budget Fit      75      │ │ • شهادة ISO غير متوفرة       │ │
│  │  Technical Fit   70      │ │                               │ │
│  │  Timeline Fit    65      │ │ ━━ الخطوات المقترحة           │ │
│  │  Strategic Fit   68      │ │ • مراجعة الكراسة             │ │
│  │  Risk Score      62      │ │ • تجهيز فريق العمل           │ │
│  └───────────────────────────┘ └───────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ الإجراءات                                                   │ │
│  │                                                             │ │
│  │  [Push to CRM]           Status: Not pushed                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Hero Header Component

**File:** `components/dashboard/tender-hero.tsx` (new)

```tsx
interface TenderHeroProps {
  title: string;
  entity: string;
  referenceNo: string;
  deadline: string | null;
  daysUntilDeadline: number | null;
  estimatedValue: { value: number | null; isEstimated: boolean };
  locale: string;
}

export function TenderHero({
  title,
  entity,
  referenceNo,
  deadline,
  daysUntilDeadline,
  estimatedValue,
  locale,
}: TenderHeroProps) {
  return (
    <Box className="tender-hero">
      <Text className="tender-hero-entity">{entity}</Text>
      <Box className="tender-hero-divider" />
      <Text className="tender-hero-title">{title}</Text>

      <Flex className="tender-hero-meta" gap="4" wrap="wrap">
        <Flex gap="2" align="center">
          <FileText size={14} />
          <Text size="2">{referenceNo}</Text>
        </Flex>

        {daysUntilDeadline !== null && (
          <Flex gap="2" align="center">
            <Calendar size={14} />
            <Text size="2">
              {daysUntilDeadline > 0
                ? `${daysUntilDeadline} ${locale === 'ar' ? 'يوم متبقي' : 'days remaining'}`
                : locale === 'ar' ? 'انتهى الموعد' : 'Deadline passed'}
            </Text>
            <Badge
              size="1"
              color={daysUntilDeadline <= 0 ? 'red' : daysUntilDeadline <= 7 ? 'amber' : 'green'}
            >
              {daysUntilDeadline <= 0 ? '⚠️' : daysUntilDeadline <= 7 ? '⏰' : '✓'}
            </Badge>
          </Flex>
        )}

        <Flex gap="2" align="center">
          <Banknote size={14} />
          <Text
            size="2"
            style={{ color: estimatedValue.isEstimated ? 'var(--amber-11)' : 'inherit' }}
          >
            {estimatedValue.isEstimated && '~'}
            {formatValue(estimatedValue.value)}
          </Text>
          {estimatedValue.isEstimated && (
            <Badge size="1" color="amber">محسوبة</Badge>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
```

**CSS:**

```css
.tender-hero {
  background: linear-gradient(
    135deg,
    var(--surface-card) 0%,
    var(--gray-a2) 100%
  );
  border: 1px solid var(--border-default);
  border-radius: var(--radius-card);
  padding: 32px;
  margin-bottom: 24px;
}

.tender-hero-entity {
  font-size: 14px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tender-hero-divider {
  width: 60px;
  height: 3px;
  background: var(--color-primary-500);
  margin: 12px 0 16px;
  border-radius: 2px;
}

.tender-hero-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  margin-bottom: 20px;
}

.tender-hero-meta {
  color: var(--text-secondary);
}
```

### 3.3 Score Display Component (Circular Gauge)

**File:** `components/dashboard/score-gauge.tsx` (new)

```tsx
interface ScoreGaugeProps {
  score: number;
  recommendation: 'qualified' | 'conditional' | 'excluded';
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreGauge({ score, recommendation, size = 'lg' }: ScoreGaugeProps) {
  const radius = size === 'lg' ? 60 : size === 'md' ? 45 : 30;
  const strokeWidth = size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const colorMap = {
    qualified: 'var(--color-qualified-text)',
    conditional: 'var(--color-conditional-text)',
    excluded: 'var(--color-excluded-text)',
  };

  return (
    <Box className="score-gauge" data-size={size}>
      <svg
        width={(radius + strokeWidth) * 2}
        height={(radius + strokeWidth) * 2}
        className="score-gauge-svg"
      >
        {/* Background circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="var(--gray-a4)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke={colorMap[recommendation]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
          className="score-gauge-progress"
        />
      </svg>

      <Box className="score-gauge-content">
        <Text className="score-gauge-value">{Math.round(score)}</Text>
        <Badge
          className="score-gauge-recommendation"
          style={{
            backgroundColor: `var(--color-${recommendation}-bg)`,
            color: `var(--color-${recommendation}-text)`,
          }}
        >
          {/* Translation handled by parent */}
        </Badge>
      </Box>
    </Box>
  );
}
```

**CSS:**

```css
.score-gauge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.score-gauge-svg {
  transform: rotate(-90deg);
}

.score-gauge-progress {
  transition: stroke-dashoffset 0.6s ease-out;
}

.score-gauge-content {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-gauge-value {
  font-size: 36px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  line-height: 1;
}

[data-size="md"] .score-gauge-value {
  font-size: 24px;
}

[data-size="sm"] .score-gauge-value {
  font-size: 18px;
}
```

### 3.4 Breakdown Progress Bars

**File:** `components/dashboard/score-breakdown.tsx` (new)

```tsx
interface BreakdownItem {
  key: string;
  label: string;
  value: number;
}

interface ScoreBreakdownProps {
  items: BreakdownItem[];
}

export function ScoreBreakdown({ items }: ScoreBreakdownProps) {
  return (
    <Flex direction="column" gap="3" className="score-breakdown">
      {items.map(({ key, label, value }) => (
        <Box key={key} className="breakdown-item">
          <Flex justify="between" align="center" mb="1">
            <Text size="1" className="breakdown-label">{label}</Text>
            <Text size="1" className="breakdown-value">{value}</Text>
          </Flex>
          <Box className="breakdown-bar">
            <Box
              className="breakdown-bar-fill"
              style={{
                width: `${value}%`,
                backgroundColor: value >= 70
                  ? 'var(--color-qualified-text)'
                  : value >= 40
                    ? 'var(--color-conditional-text)'
                    : 'var(--color-excluded-text)'
              }}
            />
          </Box>
        </Box>
      ))}
    </Flex>
  );
}
```

**CSS:**

```css
.score-breakdown {
  width: 100%;
}

.breakdown-item {
  width: 100%;
}

.breakdown-label {
  color: var(--text-secondary);
}

.breakdown-value {
  color: var(--text-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.breakdown-bar {
  height: 4px;
  background: var(--gray-a4);
  border-radius: 2px;
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease-out;
}
```

### 3.5 Evaluation Details Cards (Strengths/Risks/etc.)

**File:** `components/dashboard/evaluation-list-card.tsx` (new)

```tsx
interface EvaluationListCardProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  variant: 'success' | 'warning' | 'danger' | 'info';
}

export function EvaluationListCard({ title, items, icon, variant }: EvaluationListCardProps) {
  const variantStyles = {
    success: {
      iconBg: 'var(--color-qualified-bg)',
      iconColor: 'var(--color-qualified-text)',
      border: 'var(--color-qualified-bg)',
    },
    warning: {
      iconBg: 'var(--color-conditional-bg)',
      iconColor: 'var(--color-conditional-text)',
      border: 'var(--color-conditional-bg)',
    },
    danger: {
      iconBg: 'var(--color-excluded-bg)',
      iconColor: 'var(--color-excluded-text)',
      border: 'var(--color-excluded-bg)',
    },
    info: {
      iconBg: 'var(--gray-a3)',
      iconColor: 'var(--gray-11)',
      border: 'var(--gray-a4)',
    },
  };

  const style = variantStyles[variant];

  return (
    <Card
      className="eval-list-card"
      style={{ borderInlineStart: `3px solid ${style.border}` }}
    >
      <Flex gap="3" align="start">
        <Box
          className="eval-list-icon"
          style={{ background: style.iconBg, color: style.iconColor }}
        >
          {icon}
        </Box>
        <Box className="eval-list-content">
          <Text className="eval-list-title">{title}</Text>
          <ul className="eval-list-items">
            {items.map((item, i) => (
              <li key={i}>
                <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                  {item}
                </Text>
              </li>
            ))}
          </ul>
        </Box>
      </Flex>
    </Card>
  );
}
```

**CSS:**

```css
.eval-list-card {
  background: var(--surface-card);
  padding: 16px;
  border-radius: var(--radius-card);
}

.eval-list-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.eval-list-content {
  flex: 1;
  min-width: 0;
}

.eval-list-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.eval-list-items {
  margin: 0;
  padding-inline-start: 16px;
  list-style: disc;
}

.eval-list-items li {
  margin-bottom: 4px;
}

.eval-list-items li:last-child {
  margin-bottom: 0;
}
```

### 3.6 Two-Column Layout for Detail Page

**File:** `app/[locale]/dashboard/[tenderId]/page.tsx`

```tsx
// Updated layout structure
<Container size="4" py="6">
  {/* Back Link */}
  <Link href={`/${locale}/dashboard`} className="back-link">
    <ArrowLeft size={16} className="flip-rtl" />
    {t('backToList')}
  </Link>

  {/* Hero Header */}
  <TenderHero
    title={tender.title}
    entity={tender.entity}
    referenceNo={tender.reference_no}
    deadline={tender.deadline}
    daysUntilDeadline={getDaysFromToday(tender.deadline)}
    estimatedValue={effectiveValue}
    locale={locale}
  />

  {/* Two-Column Layout */}
  <Grid columns={{ initial: '1', md: '2' }} gap="6">
    {/* Left Column: Score & Analysis */}
    <Flex direction="column" gap="4">
      <Card className="evaluation-main-card">
        <Text className="section-title">{tEval('title')}</Text>

        <Flex direction="column" align="center" gap="4" py="4">
          {hasEvaluation ? (
            <>
              <ScoreGauge
                score={ev.score}
                recommendation={ev.recommendation}
              />
              <Badge className="recommendation-badge" data-rec={ev.recommendation}>
                {tEval(ev.recommendation)}
              </Badge>
            </>
          ) : (
            <Text size="2" color="gray">{tEval('notEvaluated')}</Text>
          )}

          <RunAnalysisButton tenderId={tender.id} hasEvaluation={hasEvaluation} />
        </Flex>

        {hasEvaluation && ev.breakdown && (
          <>
            <Separator my="4" />
            <Text className="subsection-title">{tEval('breakdown')}</Text>
            <ScoreBreakdown
              items={[
                { key: 'budget_fit', label: tEval('budgetFit'), value: ev.breakdown.budget_fit },
                { key: 'technical_fit', label: tEval('technicalFit'), value: ev.breakdown.technical_fit },
                { key: 'timeline_fit', label: tEval('timelineFit'), value: ev.breakdown.timeline_fit },
                { key: 'strategic_fit', label: tEval('strategicFit'), value: ev.breakdown.strategic_fit },
                { key: 'risk_score', label: tEval('riskScore'), value: ev.breakdown.risk_score },
              ]}
            />
          </>
        )}
      </Card>

      {/* CRM Section */}
      <Card className="crm-card">
        <Text className="section-title">{tCrm('title')}</Text>
        <PushToCRMButton
          tenderId={tender.id}
          tenderTitle={tender.title}
          hasEvaluation={hasEvaluation}
          currentStatus={tender.status}
        />
      </Card>
    </Flex>

    {/* Right Column: Details */}
    <Flex direction="column" gap="4">
      {hasEvaluation && ev.summary && (
        <Card className="summary-card">
          <Text className="section-title">{tEval('summary')}</Text>
          <Text size="2" style={{ color: 'var(--text-secondary)' }}>
            {ev.summary}
          </Text>
        </Card>
      )}

      {hasEvaluation && ev.strengths?.length > 0 && (
        <EvaluationListCard
          title={tEval('strengths')}
          items={ev.strengths}
          icon={<ThumbsUp size={16} />}
          variant="success"
        />
      )}

      {hasEvaluation && ev.risks?.length > 0 && (
        <EvaluationListCard
          title={tEval('risks')}
          items={ev.risks}
          icon={<AlertTriangle size={16} />}
          variant="danger"
        />
      )}

      {hasEvaluation && ev.missing_requirements?.length > 0 && (
        <EvaluationListCard
          title={tEval('missingRequirements')}
          items={ev.missing_requirements}
          icon={<AlertCircle size={16} />}
          variant="warning"
        />
      )}

      {hasEvaluation && ev.action_items?.length > 0 && (
        <EvaluationListCard
          title={tEval('actionItems')}
          items={ev.action_items}
          icon={<CheckSquare size={16} />}
          variant="info"
        />
      )}
    </Flex>
  </Grid>
</Container>
```

---

## Part 4: Implementation Checklist

### Phase 1: Arabic Language Fix
- [ ] Update `EVALUATOR_SYSTEM_PROMPT` in `lib/ai/prompts.ts`
- [ ] Add `isArabicText()` and `validateArabicOutput()` in `lib/ai/evaluator.ts`
- [ ] Add retry logic for non-Arabic responses
- [ ] Test with re-running evaluations

### Phase 2: Dashboard List Page
- [ ] Create/update `components/dashboard/dashboard-kpi-row.tsx` with new card design
- [ ] Update `components/dashboard/tenders-list-client.tsx`:
  - [ ] Refactor filters section with grouping
  - [ ] Add bulk actions bar
  - [ ] Enhance table row styling
  - [ ] Add score visual indicator
- [ ] Add CSS classes to `app/globals.css`
- [ ] Test RTL layout

### Phase 3: Tender Detail Page
- [ ] Create `components/dashboard/tender-hero.tsx`
- [ ] Create `components/dashboard/score-gauge.tsx`
- [ ] Create `components/dashboard/score-breakdown.tsx`
- [ ] Create `components/dashboard/evaluation-list-card.tsx`
- [ ] Update `app/[locale]/dashboard/[tenderId]/page.tsx` with new layout
- [ ] Add CSS classes to `app/globals.css`
- [ ] Test RTL layout
- [ ] Verify all evaluation content displays in Arabic

### Phase 4: Testing & QA
- [ ] Test on mobile viewport
- [ ] Test RTL/LTR switching
- [ ] Verify accessibility (focus states, ARIA)
- [ ] Test evaluation flow end-to-end
- [ ] Performance check (no layout shifts)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/ai/prompts.ts` | Modify | Strengthen Arabic enforcement |
| `lib/ai/evaluator.ts` | Modify | Add language validation |
| `app/globals.css` | Modify | Add new CSS classes |
| `components/dashboard/dashboard-kpi-row.tsx` | Modify | Redesign KPI cards |
| `components/dashboard/tenders-list-client.tsx` | Modify | Filters, table, actions |
| `components/dashboard/tender-hero.tsx` | Create | New hero component |
| `components/dashboard/score-gauge.tsx` | Create | Circular score display |
| `components/dashboard/score-breakdown.tsx` | Create | Progress bar breakdown |
| `components/dashboard/evaluation-list-card.tsx` | Create | Reusable list card |
| `app/[locale]/dashboard/[tenderId]/page.tsx` | Modify | Two-column layout |

---

## Design Tokens Reference

Ensure these tokens exist in `styles/tokens.css` or `app/globals.css`:

```css
:root {
  /* Surfaces */
  --surface-page: #fafafa;
  --surface-card: #ffffff;
  --surface-raised: #ffffff;

  /* Borders */
  --border-default: #e5e7eb;
  --radius-card: 12px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);

  /* Status Colors */
  --color-qualified-bg: #dcfce7;
  --color-qualified-text: #166534;
  --color-conditional-bg: #fef3c7;
  --color-conditional-text: #92400e;
  --color-excluded-bg: #fee2e2;
  --color-excluded-text: #991b1b;

  /* Primary (Emerald) */
  --color-primary-100: #d1fae5;
  --color-primary-200: #a7f3d0;
  --color-primary-500: #10b981;
  --color-primary-600: #059669;
}
```

---

*This plan provides all specifications needed for Cursor to implement the facelift without guesswork.*
