# Booklet PDF Parser – Tools & Implementation Reference

Quick reference for the tools and libraries used in the RFP booklet PDF feature, so you can research the implementation.

---

## 1. PDF text extraction

| Tool | Version | Role | Where used |
|------|---------|------|------------|
| **pdf-parse** | ^2.4.5 | Extract raw text from PDF buffer (Node.js). Uses PDF.js under the hood. | `lib/parsing/booklet-parser.ts` – `extractTextFromPDF()`, `ensurePDFWorker()` |

- **API (v2):** `PDFParse` class; `new PDFParse({ data: buffer })` → `parser.getText()` → `result.text`; `parser.destroy()`.
- **Worker:** Must set worker before use in Node/Next: `PDFParse.setWorker(fileUrl)` with a `file://` URL to `pdf.worker.mjs`.
- **Official:** [GitHub – mehmet-kozan/pdf-parse](https://github.com/mehmet-kozan/pdf-parse)  
- **Docs:** README (v2 migration, getText, worker), [docs/troubleshooting.md](https://github.com/mehmet-kozan/pdf-parse/blob/main/docs/troubleshooting.md), [docs/pdf-worker.md](https://github.com/mehmet-kozan/pdf-parse/blob/main/docs/pdf-worker.md).

**Transitive:** pdf-parse depends on **pdfjs-dist** (Mozilla PDF.js) for parsing; the worker is from that stack.

---

## 2. AI extraction (structured data from text)

| Tool | Version | Role | Where used |
|------|---------|------|------------|
| **Vercel AI SDK** (`ai`) | ^4.0.0 | `generateObject()` – call LLM and get structured JSON matching a Zod schema. | `lib/parsing/booklet-parser.ts` – `extractWithAI()` |
| **@ai-sdk/openai** | ^1.0.0 | OpenAI-compatible client (used for both OpenAI and DeepSeek). | `lib/ai/client.ts` – `getAIModel()` |
| **Zod** | ^3.24.0 | Schemas for extraction output; `generateObject` uses them for validation. | `lib/parsing/booklet-schema.ts` – all `*Schema` exports |

- **Flow:** PDF text → prompt + system prompt → `generateObject({ model, schema, prompt, system })` → validated object.
- **AI client:** `lib/ai/client.ts` – `getAIModel()`, `isAIConfigured()`. Supports **DeepSeek** (default) and **OpenAI** via env: `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`, optional `AI_PROVIDER`.
- **Official:** [Vercel AI SDK – generateObject](https://sdk.vercel.ai/docs/ai-sdk-core/structured-outputs), [@ai-sdk/openai](https://sdk.vercel.ai/providers/ai-sdk-providers/openai).

---

## 3. Schemas & prompts

| Location | Role |
|----------|------|
| **lib/parsing/booklet-schema.ts** | Zod schemas: `boqItemSchema`, `evaluationWeightsSchema`, `bookletMetadataSchema`, `bookletExtractionResponseSchema`; system prompt and `createBookletExtractionPrompt()` for AI. |
| **lib/parsing/booklet-parser.ts** | Imports schemas and prompts; calls `generateObject` with `bookletExtractionResponseSchema`. |

Extracted fields: BoQ items (name, quantity, unit), evaluation weights (financial/technical %), local content target %, confidence, notes.

---

## 4. Server action & UI

| Location | Role |
|----------|------|
| **actions/booklet-upload.ts** | Server action: validate tender, get file from FormData, call `parseBookletPDF(buffer)`, update `tender.booklet_metadata`, optional re-evaluation, revalidate. |
| **components/dashboard/booklet-upload-card.tsx** | Drag-and-drop upload UI; calls `uploadBookletAction(tenderId, formData)`. |
| **components/dashboard/tender-detail-view.tsx** | Renders `BookletUploadCard` on tender detail page. |

---

## 5. Database

| Item | Role |
|------|------|
| **Column** | `tenders.booklet_metadata` (JSONB) – stores extracted metadata. |
| **Migration** | `supabase/migrations/00019_booklet_metadata.sql` |
| **Types** | `types/database.ts` – `booklet_metadata` on tenders type. |

---

## 6. End-to-end flow

1. User drops PDF on tender detail → **BookletUploadCard**.
2. **uploadBookletAction** receives FormData, gets buffer, calls **parseBookletPDF(buffer)**.
3. **booklet-parser:** `ensurePDFWorker()` (worker path from `process.cwd()` + `node_modules/pdf-parse/.../pdf.worker.mjs`), then **pdf-parse** `PDFParse` → **getText()** → raw text.
4. **extractWithAI(pdfText):** **AI SDK** `generateObject` with **booklet-schema** prompts/schema → structured BoQ, weights, local content, confidence.
5. **uploadBookletAction** writes result to **Supabase** `tenders.booklet_metadata`, revalidates, optionally runs evaluation.

---

## 7. Research links (official)

- pdf-parse v2: https://github.com/mehmet-kozan/pdf-parse  
- pdf-parse worker / Node: https://github.com/mehmet-kozan/pdf-parse/blob/main/docs/troubleshooting.md  
- pdf-parse worker path: https://github.com/mehmet-kozan/pdf-parse/blob/main/docs/pdf-worker.md  
- Vercel AI SDK – structured output: https://sdk.vercel.ai/docs/ai-sdk-core/structured-outputs  
- Zod: https://zod.dev  

---

## 8. Env for AI extraction

- **DEEPSEEK_API_KEY** or **OPENAI_API_KEY** (at least one).
- Optional: **AI_PROVIDER** = `deepseek` | `openai` (default: `deepseek`).
