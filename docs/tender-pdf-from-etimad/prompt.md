C:\Dev\Builds\etmam-app\docs\tender-pdf-from-etimad this is the folder where the files are. 
lets build the praser 

# TASK: Build "RFP PDF Ingestion" for Deep Data Extraction

**OBJECTIVE**
Allow the user to upload a "Booklet PDF" (Kurrasa) on the Tender Detail page. Parse this PDF to extract high-value fields (BoQ, Weights, Local Content) and update the tender's evaluation.

**PHASE 1: The UI (Upload Zone)**
File: `components/dashboard/tender-detail-view.tsx`
1.  Add a new Card: `ManualIngestionCard`.
2.  **UI:** A drag-and-drop zone labeled "Upload Booklet (PDF)".
3.  **Action:** On drop, trigger a Server Action `uploadTenderBooklet(tenderId, formData)`.

**PHASE 2: The Logic (Parser Service)**
File: `lib/parsing/booklet-parser.ts` (Create new)
1.  **Function:** `parseBookletPDF(fileBuffer)`
2.  **Strategy:**
    * Convert PDF to text (use `pdf-parse` or similar).
    * **AI Extraction:** Send the raw text to our LLM provider with this prompt:
        "Analyze this Saudi Government Tender RFP. Return JSON with:
        - `boq_items`: Array of { name, quantity, unit } (Look for tables with 'الكمية' and 'الوصف').
        - `evaluation_weights`: { financial_weight, technical_weight } (Look for 'معايير تقييم العروض').
        - `local_content_target`: Number (Look for 'المحتوى المحلي' percentage)."

**PHASE 3: The Data Update**
File: `actions/booklet-upload.ts`
1.  **Workflow:**
    * Save PDF to storage (Supabase Storage).
    * Run `parseBookletPDF`.
    * **Update DB:** Save the extracted data into a new JSONB column `booklet_metadata` on the `tenders` table.
    * **Trigger Re-Eval:** Call `scoreTenderV2(tenderId)` immediately.

**PHASE 4: Visual Feedback**
File: `components/dashboard/tender-detail-view.tsx`
1.  If `booklet_metadata` exists:
    * Show a "Verified Data" badge.
    * Display the extracted BoQ items in a simple table.
    * Show the "Exact Evaluation Weights" used.
