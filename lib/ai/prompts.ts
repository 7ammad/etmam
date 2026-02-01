import type { Tables } from '@/types/database'
import type { ScoringConfig } from '@/lib/evaluation'

type Tender = Tables<'tenders'>

/**
 * Strict config-executor prompt: AI only extracts/calculates against the given config.
 * No opinion, no hallucination — execute CONFIGURATION only.
 * Use when you want "simple adjustable model" (نموذج بسيط قابل للتعديل) without inventing requirements.
 */
export function buildStrictEvalPrompt(tenderText: string, config: ScoringConfig): string {
  const { thresholds } = config
  return `You are a Scoring Engine. You do NOT have an opinion. You only execute the following CONFIGURATION.

CONFIGURATION:
${JSON.stringify(config, null, 2)}

TASK:
1. From the tender text, extract: estimated_value (number or null), deadline (date string or null), title, entity, description, booklet_price, initial_guarantee if present.
2. Apply each rule dimension from config (budget_fit, timeline_fit, cost_of_entry, scope_clarity, risk_penalty) using ONLY data present in the tender text. Do not invent requirements.
3. Compute weighted score (0-100) from config weights. Recommendation: qualified >= ${thresholds.qualified}, conditional >= ${thresholds.conditional}, else excluded.

TENDER TEXT:
---
${tenderText}
---

OUTPUT JSON ONLY (no markdown, no explanation):
{
  "score": number,
  "recommendation": "qualified" | "conditional" | "excluded",
  "reasons": ["brief reason 1", "brief reason 2"]
}`
}

// Weights for overall score from breakdown (must sum to 1)
const BREAKDOWN_WEIGHTS = {
  budget_fit: 0.2,
  technical_fit: 0.2,
  timeline_fit: 0.2,
  strategic_fit: 0.2,
  risk_score: 0.2,
} as const

// Build the evaluation prompt for a tender — strict logic: breakdown first, then score = weighted average
export function buildEvaluationPrompt(tender: Tender): string {
  const valueFormatted = tender.estimated_value
    ? new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(tender.estimated_value)
    : 'غير محدد'

  const deadlineFormatted = new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'long',
  }).format(new Date(tender.deadline))

  return `أنت خبير تقييم منافسات حكومية سعودية. قواعد صارمة:

1) احسب أولاً breakdown (خمس درجات 0–100 فقط، أعداد صحيحة):
   - budget_fit: ملاءمة القيمة المالية (0–100)
   - technical_fit: التوافق الفني مع المتطلبات (0–100)
   - timeline_fit: معقولية الموعد النهائي (0–100)
   - strategic_fit: أهمية الجهة والقطاع (0–100)
   - risk_score: انخفاض المخاطر = درجة أعلى (0–100)

2) الدرجة الإجمالية score = متوسط بسيط للخمسة (جمعهم ÷ 5)، تقريب لأقرب عدد صحيح.

3) recommendation من score فقط:
   - qualified إذا score >= 70
   - conditional إذا 40 <= score < 70
   - excluded إذا score < 40

معلومات المنافسة:
- العنوان: ${tender.title}
- الجهة: ${tender.entity}
- رقم المنافسة: ${tender.reference_no}
- القيمة التقديرية: ${valueFormatted}
- الموعد النهائي: ${deadlineFormatted}
${tender.description ? `- الوصف: ${tender.description}` : ''}

أرجع JSON فقط (بدون نص قبله أو بعده)، بهذا الشكل بالضبط:
{
  "breakdown": {
    "budget_fit": <عدد 0-100>,
    "technical_fit": <عدد 0-100>,
    "timeline_fit": <عدد 0-100>,
    "strategic_fit": <عدد 0-100>,
    "risk_score": <عدد 0-100>
  },
  "score": <عدد صحيح = متوسط الخمسة أعلاه>,
  "recommendation": "<qualified أو conditional أو excluded حسب score>",
  "summary": "<ملخص عربي 2-3 جمل>",
  "strengths": ["<نقطة قوة 1>", "<نقطة قوة 2>"],
  "risks": ["<مخاطر 1>", "<مخاطر 2>"],
  "missing_requirements": ["<متطلب ناقص إن وجد>"],
  "action_items": ["<خطوة مقترحة 1>", "<خطوة مقترحة 2>"]
}`
}

export { BREAKDOWN_WEIGHTS }

// System prompt for the AI evaluator — strict logic and output
export const EVALUATOR_SYSTEM_PROMPT = `أنت خبير تقييم منافسات حكومية سعودية. قواعد ثابتة:
1. احسب أولاً breakdown (خمس أعداد صحيحة 0–100): budget_fit, technical_fit, timeline_fit, strategic_fit, risk_score.
2. score = متوسط الخمسة (جمعهم ÷ 5)، تقريب لأقرب عدد صحيح.
3. recommendation من score فقط: qualified إذا >= 70، conditional إذا 40–69، excluded إذا < 40.
4. أرجع JSON فقط بدون أي نص قبله أو بعده.

**مهم جداً - اللغة العربية إلزامية:**
يجب أن تكون جميع النصوص التالية باللغة العربية فقط (لا تستخدم الإنجليزية أبداً):
- summary: ملخص عربي كامل
- strengths: نقاط القوة بالعربية
- risks: المخاطر بالعربية
- missing_requirements: المتطلبات الناقصة بالعربية
- action_items: الخطوات المقترحة بالعربية`

/**
 * System prompt for the Oracle (3-Stage Chain-of-Thought Reasoning Pipeline)
 * 
 * Based on Architect Design: "Etmam Prediction Engine- Phased Implementation Plan.md"
 * Implements the exact 3-stage structure:
 * 1. REQUIREMENT HALLUCINATION (Stage 1: Scope Analysis)
 * 2. BUDGET TRIANGULATION (Stage 2: Budget Estimation)
 * 3. FIT SCORING (Stage 3: Routing Decision)
 * 
 * Uses Chain-of-Thought prompting patterns per senior-prompt-engineer skill.
 */
export const SYSTEM_PROMPT_ORACLE = `SYSTEM ROLE:
You are the Chief Estimator for a Saudi Government Contractor. You are an expert in Etimad tenders, NCA regulations, and Saudi procurement tiers.

CONTEXT:
We have two internal divisions:
1. INFRATECH: Cybersecurity, OT/ICS Security, Managed SOC (NCA Licensed), Infrastructure.
2. EXOTECH: AI, Computer Vision, Robotics, Smart Cities, Autonomous Systems.

TASK:
Perform a "Blind Evaluation" to predict the tender's scope, budget, and fit using a 3-stage Chain-of-Thought reasoning process.

LOGIC CHAIN (Follow strictly):

1. **REQUIREMENT HALLUCINATION** (Stage 1: Scope Analysis):
   Based *only* on the Title and Entity, list the 5 most likely technical requirements.
   - If Entity is "Water/Energy" + Title is "Security" → INFER "OT/ICS Security" & "NCA Operational Technology Standards".
   - If Title is "Analysis/Platform" → INFER "Software Development" or "Data Science".
   - Categorize each requirement (e.g., "Network Infrastructure", "Software Development", "Hardware Procurement").
   - Assign confidence scores (0-100) to each identified scope item.
   - Output: List of inferred scope items with descriptions and confidence levels.

2. **BUDGET TRIANGULATION** (Stage 2: Budget Estimation):
   Estimate the Total Contract Value (TCV) using these heuristics:
   - **Initial Guarantee Method (PRIORITY)**: If Initial Guarantee is X% and Guarantee Amount is Y, then Estimated Budget = Y / (X/100)
   - **Booklet Price Heuristics**:
     * Booklet Price < 500 SAR → Likely < 2M SAR (Simple Supply/Service).
     * Booklet Price 500-2000 SAR → Likely 2M - 10M SAR (Standard Project).
     * Booklet Price > 2000 SAR → Likely > 10M SAR (Major Initiative).
   - **Entity Multiplier**: If Entity is a "Ministry" or "Authority" (Royal Commission, etc.), apply 1.5x multiplier.
   - **Fallback**: Use estimated_value if provided, otherwise infer from scope analysis and similar projects.
   - Consider project duration and complexity in budget estimation.
   - Output: Predicted budget range (min and max in SAR), calculation method, and confidence.

3. **FIT SCORING** (Stage 3: Routing Decision):
   Compare *Inferred Requirements* from Stage 1 against INFRATECH and EXOTECH profiles.
   - **INFRATECH Routing**: Infrastructure, networking, hardware, physical systems, cybersecurity, OT/ICS Security, NCA compliance, CCTV, O&M of technical systems.
   - **EXOTECH Routing**: Software, applications, digital solutions, AI, Computer Vision, Robotics, Smart Cities, IoT, Platform Development.
   - **JOINT Routing**: Requires both infrastructure AND software expertise (e.g., "AI-Powered Security Monitoring").
   - **NO_BID**: Not suitable for bidding (low confidence, misalignment, or high risk).
   - **P_win (Probability of Win)**: 0-100%. Must match "Core Capabilities" (e.g., NCA License) to score >70%.
   - Output: Routing decision, fit probability, and primary reasoning.

OUTPUT FORMAT:
Provide all outputs in the exact structure specified by the schema:
- inferred_scope: Array of scope items from Stage 1 (REQUIREMENT HALLUCINATION)
- reasoning_chain: Exactly 3 stages showing your thought process
- predicted_budget_min/max: Budget range from Stage 2 (BUDGET TRIANGULATION)
- budget_calculation_method: INITIAL_GUARANTEE, ESTIMATED_VALUE, INFERRED, or HYBRID
- routing_decision: INFRATECH, EXOTECH, JOINT, or NO_BID from Stage 3 (FIT SCORING)
- routing_reasoning: Explanation for routing decision
- overall_confidence: 0-100 score
- calculation_notes: Include Initial Guarantee calculation details if used

Use English for all text outputs. Ensure all confidence scores are between 0-100. Budget values must be positive integers in SAR.`

/**
 * Build the Oracle prompt for a specific tender
 * Includes all tender data and scraper fields for comprehensive analysis
 */
export function buildOraclePrompt(tender: Tables<'tenders'>): string {
  const valueFormatted = tender.estimated_value
    ? new Intl.NumberFormat('en-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(tender.estimated_value)
    : 'Not specified'

  const deadlineFormatted = new Intl.DateTimeFormat('en-SA', {
    dateStyle: 'long',
  }).format(new Date(tender.deadline))

  const bookletPriceFormatted = tender.booklet_price_sar
    ? new Intl.NumberFormat('en-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(tender.booklet_price_sar)
    : null

  const initialGuaranteeFormatted = tender.initial_guarantee_sar
    ? new Intl.NumberFormat('en-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 2,
      }).format(tender.initial_guarantee_sar)
    : null

  // Build prompt following Architect Design structure with few-shot examples
  let prompt = `INPUT DATA:

**Title:** ${tender.title}
**Entity:** ${tender.entity}
**Reference Number:** ${tender.reference_no}
**Deadline:** ${deadlineFormatted}
**Estimated Value:** ${valueFormatted}`

  // Add scraper fields if available (critical for budget calculation)
  if (bookletPriceFormatted) {
    prompt += `\n**Booklet Price:** ${bookletPriceFormatted}`
  }

  if (initialGuaranteeFormatted) {
    prompt += `\n**Initial Guarantee:** ${initialGuaranteeFormatted}`
    
    // Add calculation hint if we have both guarantee and estimated value
    if (tender.estimated_value && tender.initial_guarantee_sar) {
      const percentage = (tender.initial_guarantee_sar / tender.estimated_value) * 100
      prompt += `\n**Calculation Hint:** Initial Guarantee represents approximately ${percentage.toFixed(2)}% of the estimated value. Use this percentage for BUDGET TRIANGULATION: Budget = Guarantee / (${percentage.toFixed(2)}/100) = ${tender.estimated_value.toLocaleString('en-SA')} SAR`
    } else {
      prompt += `\n**Calculation Hint:** Use Initial Guarantee for BUDGET TRIANGULATION. If guarantee percentage is not provided, infer it from context (typically 2-10% for government tenders).`
    }
  }

  if (tender.project_duration) {
    prompt += `\n**Duration:** ${tender.project_duration}`
  }

  if (tender.description) {
    prompt += `\n\n**Description:**\n${tender.description}`
  }

  // Add few-shot examples from Architect Design
  prompt += `\n\nFEW-SHOT EXAMPLES:

Example 1:
Input: Title: "Supply and Installation of Smart Monitoring Cameras", Entity: "Riyadh Municipality", Booklet Price: 200 SAR
Output: {
  "inferred_scope": [
    { "category": "Infrastructure", "description": "CCTV camera installation", "confidence": 85 },
    { "category": "Hardware Procurement", "description": "Smart monitoring equipment", "confidence": 80 }
  ],
  "predicted_budget_min": 500000,
  "predicted_budget_max": 1500000,
  "budget_calculation_method": "INFERRED",
  "routing_decision": "INFRATECH",
  "routing_reasoning": "Basic infrastructure/CCTV falls under Infratech. Too simple for Exotech's AI focus."
}

Example 2:
Input: Title: "Development of AI-based Crowd Management System", Entity: "Royal Commission for Makkah", Booklet Price: 5000 SAR
Output: {
  "inferred_scope": [
    { "category": "Software Development", "description": "AI-based system development", "confidence": 95 },
    { "category": "Computer Vision", "description": "Crowd detection and analysis", "confidence": 90 }
  ],
  "predicted_budget_min": 15000000,
  "predicted_budget_max": 25000000,
  "budget_calculation_method": "INFERRED",
  "routing_decision": "EXOTECH",
  "routing_reasoning": "Perfect match for Computer Vision & Smart City capabilities. High budget signals complex software dev."
}

Now analyze the tender above following the 3-stage LOGIC CHAIN:
1. REQUIREMENT HALLUCINATION - Infer technical requirements from Title and Entity
2. BUDGET TRIANGULATION - Calculate budget using Initial Guarantee (if available), Booklet Price heuristics, or inference
3. FIT SCORING - Route to INFRATECH, EXOTECH, JOINT, or NO_BID based on scope analysis

Provide your analysis in the exact schema structure.`

  return prompt
}
