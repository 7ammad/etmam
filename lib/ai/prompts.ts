import type { Tables } from '@/types/database'

type Tender = Tables<'tenders'>

// Build the evaluation prompt for a tender
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

  return `أنت خبير تقييم منافسات حكومية سعودية. قم بتحليل هذه المنافسة وأعطني تقييماً شاملاً.

معلومات المنافسة:
- العنوان: ${tender.title}
- الجهة: ${tender.entity}
- رقم المنافسة: ${tender.reference_no}
- القيمة التقديرية: ${valueFormatted}
- الموعد النهائي: ${deadlineFormatted}
${tender.description ? `- الوصف: ${tender.description}` : ''}

قم بتقييم المنافسة بناءً على المعايير التالية:
1. الملاءمة المالية (budget_fit): هل القيمة مناسبة؟ (0-100)
2. التوافق الفني (technical_fit): مدى تطابق المتطلبات مع القدرات العامة (0-100)
3. الجدول الزمني (timeline_fit): هل الموعد النهائي معقول؟ (0-100)
4. التوافق الاستراتيجي (strategic_fit): مدى أهمية الجهة والقطاع (0-100)
5. تقييم المخاطر (risk_score): كلما انخفضت المخاطر ارتفعت الدرجة (0-100)

أعطني الناتج بالصيغة التالية (JSON فقط، بدون أي نص إضافي):

{
  "score": <درجة إجمالية من 0 إلى 100>,
  "recommendation": "<qualified أو conditional أو excluded>",
  "summary": "<ملخص في 2-3 جمل بالعربية>",
  "strengths": ["<نقطة قوة 1>", "<نقطة قوة 2>"],
  "risks": ["<مخاطر 1>", "<مخاطر 2>"],
  "missing_requirements": ["<متطلب ناقص 1>"],
  "action_items": ["<خطوة مقترحة 1>", "<خطوة مقترحة 2>"],
  "breakdown": {
    "budget_fit": <0-100>,
    "technical_fit": <0-100>,
    "timeline_fit": <0-100>,
    "strategic_fit": <0-100>,
    "risk_score": <0-100>
  }
}

قواعد التوصية:
- qualified (مؤهل): الدرجة >= 70
- conditional (مشروط): الدرجة بين 40 و 69
- excluded (مستبعد): الدرجة < 40

أجب بـ JSON فقط.`
}

// System prompt for the AI evaluator
export const EVALUATOR_SYSTEM_PROMPT = `أنت مساعد متخصص في تقييم المنافسات الحكومية السعودية.
تقوم بتحليل المنافسات وتقديم تقييم موضوعي ومفصل.
جميع ردودك يجب أن تكون بصيغة JSON صالحة.
استخدم اللغة العربية في جميع النصوص داخل JSON.`
