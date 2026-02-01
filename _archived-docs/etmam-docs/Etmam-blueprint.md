<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# this is the original request, the app should be Arabic native and English as important, light and dark. include the UX/UI plan in the implementation plan (not that any other part of the backend and the engine it self is less important) use the Agent 2 UI to build the UX/UI

Based on your requirements for **native Arabic support (RTL)**, **Light/Dark modes**, and using the **A2UI protocol** for the UI/UX generation, I have updated the plan.

This is a comprehensive **Product Requirements Document (PRD)** tailored for the Infratech competition. It includes the specific implementation details for Arabic/RTL and A2UI.

***

# Product Requirements Document (PRD): Etmaam (MVP)

**Project:** Automated Tender Qualification \& CRM Connector
**Platform:** Web (Next.js PWA)
**Primary Language:** **Arabic** (with English fallback)
**UI Strategy:** Agent-Generated UI (A2UI) using Cursor as the "Builder Agent"
**Visuals:** High-Fidelity, Light/Dark Mode, RTL-Native

***

## 1. Executive Summary

**Etmaam** is an intelligent SaaS dashboard that automates the qualification of government tenders.
**The Twist:** It is built with a "Privacy-First" approach where the AI acts as a silent backend analyst. The UI is fully responsive, supports Arabic natively (RTL), and adapts to the user's preferred theme (Light/Dark).
**Competition Goal:** Win the 20,000 SAR prize by demonstrating a polished, working workflow that feels like a finished product, not just a hackathon demo.

***

## 2. User Experience (UX) Strategy

**Core Philosophy:** "Arabic First, Business Ready."
Most dashboards fail at RTL. Etmaam will excel at it.

### 2.1. Visual Language

* **Typography:** *IBM Plex Sans Arabic* (Google Fonts) for a modern, tech-forward look.
* **Direction:** Default is RTL (`dir="rtl"`). All icons (arrows, chevrons) must flip automatically.
* **Theme:**
    * **Light Mode:** "Ministry Clean" – White backgrounds, slate text, emerald green accents (Saudi flag inspired).
    * **Dark Mode:** "Midnight Operator" – Deep charcoal (\#0f172a), silver text, neon emerald accents.


### 2.2. The "Etmaam" Workflow

1. **Login:** Clean center card. "تسجيل الدخول" (Sign In).
2. **Dashboard:**
    * **Top Bar:** Stats (Tenders Processed, Qualified, Value).
    * **Main Area:** A sortable Data Table of tenders.
    * **Upload:** A prominent "Drop Zone" for Etimad files.
3. **The Analysis (AI Magic):**
    * Rows animate with a "Pulse" effect while processing.
    * Result: A badge appears. **"مؤهل" (Qualified)** in Green, or **"مستبعد" (Excluded)** in Red.
4. **Detail View (Slide-Over):**
    * Clicking a row opens a side panel.
    * **Content:** AI Summary (in Arabic), Match Score, Missing Docs.
    * **Action:** "اعتماد الفرصة" (Approve Opportunity) -> Pushes to CRM.

***

## 3. Technical Architecture (Verified)

### 3.1. Tech Stack (Latest Versions)

| Component | Technology | Version | Notes |
| :-- | :-- | :-- | :-- |
| **Framework** | Next.js | **v16.1.4** | Use App Router \& Server Actions. |
| **Language** | TypeScript | **v5.7+** | Strict mode enabled. |
| **Styling** | Tailwind CSS | **v4.0** | Native RTL support via `rtl:` variant. |
| **UI Library** | Shadcn/UI | **Latest** | Accessible, headless, easy to style. |
| **Auth/DB** | Supabase | **SSR Pkg** | Secure backend. |
| **AI** | Vercel AI SDK | **v4.x** | Streaming JSON responses. |
| **Icons** | Lucide React | **Latest** | Clean, modern SVG icons. |

### 3.2. Internationalization (i18n)

* **Library:** `next-intl` (Best performance for App Router).
* **Strategy:**
    * `/ar/dashboard` -> Arabic (RTL)
    * `/en/dashboard` -> English (LTR)
    * **Middleware:** Auto-detects user locale but defaults to `ar`.


### 3.3. A2UI Implementation (The "Builder" Protocol)

We will use the **A2UI Protocol** conceptually to let Cursor (the Agent) generate the UI components.

* **Protocol:** Server sends a JSON stream describing the UI.
* **Client:** A `DynamicRenderer` component maps JSON -> Shadcn Components.
* **Why:** This allows the AI to "decide" if a Tender needs a *Warning Alert*, a *Success Graph*, or a *Missing Info Form* dynamically.

***

## 4. Implementation Plan (30 Days)

### Phase 1: Foundation \& "Arabic First" Setup (Days 1-5)

* **Goal:** A working "Shell" that handles RTL/LTR and Dark Mode perfectly.
* **Cursor Prompt:**
> "Create a Next.js 16 app with Tailwind v4. Configure `next-intl` for Arabic (default) and English. Set up a `ThemeToggle` for Light/Dark mode. Ensure the `layout.tsx` dynamically sets `dir='rtl'` or `ltr` based on the locale. Use *IBM Plex Sans Arabic* font."


### Phase 2: The Data Engine (Days 6-12)

* **Goal:** Upload CSV, Parse, Store in Supabase.
* **Feature:** `FileUploader` component that accepts Excel/CSV.
* **Cursor Prompt:**
> "Create a Supabase table `tenders`. Build a Drag-and-Drop component using `react-dropzone`. When a file is dropped, parse it with `papaparse` (handle Arabic encoding properly!) and insert rows into Supabase."


### Phase 3: The AI Analyst (Days 13-20)

* **Goal:** The "Brain" that scores the tenders.
* **Feature:** Server Action `analyzeTender`.
* **Prompt Engineering:**
> "You are an expert Tender Analyst. Review this tender title (Arabic). Output a JSON object with: `score` (0-100), `summary_ar` (Arabic summary), `risk_level`, and `missing_docs`. Return valid JSON."


### Phase 4: The A2UI Dynamic View (Days 21-27)

* **Goal:** The "Detail Panel" that impresses the judges.
* **Concept:** The AI doesn't just return text; it returns *UI suggestions*.
* **Cursor Prompt:**
> "Create a `DynamicRenderer` component. It takes a JSON array like `[{ type: 'alert', variant: 'destructive', content: 'Low Budget' }]`. Map this to Shadcn's Alert component. If type is 'stats', map to a Card grid."


### Phase 5: Polish \& CRM Push (Days 28-30)

* **Goal:** The "Win" moment.
* **Feature:** "Approve" button that moves data to `deals` table.
* **Polish:** Add "Confetti" animation on approval. Ensure all loading states have skeletons (Right-to-Left shimmering).

***

## 5. Specific Instructions for Cursor (The Builder Agent)

**Copy/Paste this to start your build session:**

> "Act as a Senior Frontend Architect. We are building 'Etmaam', a Next.js 16 SaaS for the Saudi market.
>
> **Global Constraints:**
> 1. **Language:** Native Arabic (RTL) is the default. English is secondary.
> 2. **Theme:** Support System/Light/Dark modes using `next-themes`.
> 3. **UI Protocol:** We are using an 'A2UI-inspired' approach where the backend sends UI-structure JSON (components) instead of just raw text.
>
> **Task 1: Project Scaffold**
> Initialize the project with:
> - Next.js 16 (App Router)
> - Tailwind CSS v4
> - Shadcn/UI
> - Supabase SSR
> - Font: IBM Plex Sans Arabic
> - `next-intl` configured for `/ar` and `/en` routing.
>
> Please generate the `layout.tsx`, `middleware.ts`, and `tailwind.config.ts` first."

***

## 6. Success Checklist for the Competition

1. [ ] **Does it work in Arabic?** (Check: Do bullet points align right? Does the back button point right?)
2. [ ] **Is the Dark Mode usable?** (Check: sufficient contrast on dark backgrounds).
3. [ ] **Does the AI actually help?** (Check: Does it correctly identify a "bad" tender?)
4. [ ] **Is the code clean?** (Next.js 16 standards, Server Actions, Type Safety).

This plan ensures you meet the technical depth (A2UI, AI) while nailing the user experience (Native Arabic, Dark Mode) that is critical for a regional competition like Infratech.
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^2][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: lqt-l-ml-fkr.txt

[^2]: lqt-l-ml-fkr.txt

[^3]: https://a2ui.org

[^4]: https://www.droidcon.com/2021/08/23/supporting-rtl-design-on-android/

[^5]: https://github.com/google/docsy/issues/253

[^6]: https://discuss.google.dev/t/support-in-rtl-languages/63599

[^7]: https://groups.google.com/g/android-platform/c/W6fGVwl9in0

[^8]: https://stackoverflow.com/questions/73577373/how-would-you-specify-multiple-languages-for-a-schema-with-inlanguage-property

[^9]: https://intlayer.org/blog/nextjs-internationalization-using-next-i18next

[^10]: https://i18nexus.com/posts/comparing-next-i18next-and-react-intl

[^11]: https://madrus4u.vercel.app/blog/rtl-implementation-guide

[^12]: https://discuss.ai.google.dev/t/issues-with-arabic-language-support-small-font-size-and-lack-of-right-to-left-rtl-text-direction/89158

[^13]: https://a2ui.org/specification/v0.8-a2ui/

[^14]: https://nextjs.org/docs/app/guides/internationalization

[^15]: https://i18nexus.com/posts/comparing-react-i18next-and-react-intl

[^16]: https://flyonui.com/docs/customization/rtl/

[^17]: https://stackoverflow.com/questions/44211307/force-rtl-on-ltr-devices

