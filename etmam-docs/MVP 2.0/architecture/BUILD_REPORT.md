# Etmaam CRM - Build Report
**Generated:** January 26, 2026  
**Branch:** `claude/add-system-prompt-zKgTl`  
**Commit:** `a9d2caf` - docs: add CLAUDE.md with anti-hallucination system prompt

---

## 📊 Project Overview

**Project Name:** Etmaam CRM  
**Version:** 0.1.0  
**Type:** Full-Stack Web Application  
**Purpose:** Automated Tender Qualification & CRM Connector for Saudi Market  
**Architecture:** Next.js App Router with Server Actions, Supabase Backend

---

## 🛠️ Technology Stack

### Core Framework
- **Next.js:** 16.1.4 (App Router, Server Actions)
- **React:** 19.2.3
- **TypeScript:** 5.9.3 (Strict Mode)
- **Node.js:** ES2017+ target

### Styling & UI
- **Tailwind CSS:** 4.1.18 (v4 with PostCSS)
- **Radix UI Themes:** 3.2.1 (Component Library)
- **Lucide React:** 0.460.0 (Icons)
- **next-themes:** 0.4.6 (Dark Mode)

### Backend & Database
- **Supabase:** 2.91.1 (PostgreSQL, Auth, RLS)
- **@supabase/ssr:** 0.5.2 (Server-Side Rendering)

### AI & Processing
- **Vercel AI SDK:** 4.3.19
- **@ai-sdk/openai:** 1.3.24
- **Zod:** 3.25.76 (Schema Validation)

### Internationalization
- **next-intl:** 3.26.5 (Arabic/English RTL Support)

### Data Processing
- **PapaParse:** 5.5.3 (CSV Parsing)
- **xlsx:** 0.18.5 (Excel Parsing)
- **react-dropzone:** 14.3.8 (File Upload)

### Testing
- **Playwright:** 1.58.0 (E2E Testing)

### Package Manager
- **pnpm:** 9.15.0

---

## 📁 Project Structure

### File Counts
- **React Components (TSX):** 49 files
  - App Pages: 18 files
  - Components: 31 files
- **TypeScript Libraries:** 18 files
- **Server Actions:** 3 files
- **Type Definitions:** 5 files

### Directory Structure
```
etmaam/
├── app/                          # Next.js App Router
│   ├── [locale]/                # Internationalized routes (ar/en)
│   │   ├── dashboard/           # Dashboard pages
│   │   ├── login/               # Authentication
│   │   ├── settings/            # User settings
│   │   └── tenders-list/        # Tender listing
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── dashboard/               # Dashboard components
│   ├── landing/                 # Landing page sections
│   ├── layout/                  # Layout components
│   ├── modals/                  # Modal dialogs
│   ├── providers/               # Context providers
│   ├── settings/                # Settings components
│   ├── tender/                  # Tender components
│   └── ui/                      # UI primitives
├── lib/                         # Shared libraries
│   ├── ai/                      # AI evaluation logic
│   ├── auth/                    # Authentication utilities
│   ├── crm/                     # CRM integration
│   ├── parser/                  # File parsing (CSV/Excel)
│   ├── queries/                 # Database queries
│   └── supabase/                # Supabase clients
├── actions/                     # Next.js Server Actions
│   ├── crm.ts                   # CRM operations
│   ├── evaluation.ts            # AI evaluation
│   └── tender.ts                # Tender management
├── types/                       # TypeScript definitions
│   ├── database.ts              # Supabase types
│   ├── tender.ts                # Tender types
│   ├── evaluation.ts            # Evaluation types
│   └── crm.ts                   # CRM types
├── supabase/                    # Database migrations
│   └── migrations/
├── styles/                      # CSS files
│   ├── tokens.css               # Design tokens
│   └── animations.css           # Animations
├── messages/                    # i18n translations
│   ├── ar.json                  # Arabic
│   └── en.json                  # English
└── i18n/                        # i18n configuration
```

---

## 🗄️ Database Schema

### Tables (4)
1. **tenders** - Tender records
   - Core fields: entity, title, reference_no, deadline, estimated_value
   - Status tracking: pending, evaluating, evaluated, approved, pushed, rejected
   - Raw data storage (JSONB)

2. **evaluations** - AI evaluation results
   - Score (0-100), recommendation (qualified/conditional/excluded)
   - Arabic summaries, strengths, risks, action items
   - Breakdown JSONB for detailed scoring

3. **crm_configs** - CRM provider configurations
   - Supports: webhook, hubspot, salesforce, zoho, odoo
   - Provider-specific JSONB config

4. **crm_pushes** - CRM push history
   - Tracks push status, external IDs, errors

### Enums (4)
- `tender_status`: pending, evaluating, evaluated, approved, pushed, rejected
- `recommendation_type`: qualified, conditional, excluded
- `crm_provider`: webhook, hubspot, salesforce, zoho, odoo
- `push_status`: pending, success, failed

### Indexes (9)
- Tenders: user_id, status, deadline, created_at
- Evaluations: tender_id, score, recommendation
- CRM Configs: user_id, provider
- CRM Pushes: tender_id, status

### Security
- **Row Level Security (RLS):** Enabled on all tables
- **Policies:** User-scoped access (users can only access their own data)
- **Service Role:** Used for admin operations

---

## 🎨 Design System

### Theme Configuration
- **Primary Color:** Emerald Green (#10b981) - Saudi-inspired
- **Neutral Palette:** Slate scale
- **Semantic Colors:** Success, Warning, Error, Info
- **Status Colors:** Qualified (green), Conditional (amber), Excluded (red)

### Typography
- **Arabic:** Noto Kufi Arabic, Cairo
- **Latin:** Inter, Cairo
- **Mono:** JetBrains Mono, Fira Code

### Spacing
- Base unit: 4px
- Scale: 0.25rem to 6rem (0 to 24)

### Responsive Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

---

## 🌐 Internationalization

### Supported Locales
- **Arabic (ar):** Default, RTL layout
- **English (en):** LTR layout

### Features
- Automatic locale detection
- Route-based localization (`/ar/*`, `/en/*`)
- RTL-aware components
- Bilingual translations (ar.json, en.json)

---

## 🤖 AI Integration

### AI Provider
- **Primary:** OpenAI (via Vercel AI SDK)
- **Model:** Configurable (default: deepseek-chat)
- **Features:**
  - Tender evaluation with scoring (0-100)
  - Recommendation generation (qualified/conditional/excluded)
  - Arabic summary generation
  - Risk identification
  - Action item suggestions

### Evaluation Flow
1. Tender status → `evaluating`
2. AI processes tender data
3. Generates score, recommendation, summary
4. Stores in `evaluations` table
5. Tender status → `evaluated`

---

## 📤 CRM Integration

### Supported Providers
- **Webhook:** Generic HTTP webhook
- **HubSpot:** Native HubSpot API
- **Salesforce:** (Planned)
- **Zoho:** (Planned)
- **Odoo:** (Planned)

### Push Flow
1. User configures CRM provider in settings
2. Selects qualified tenders
3. Pushes to CRM via provider adapter
4. Tracks push status in `crm_pushes` table

---

## 📄 File Processing

### Supported Formats
- **CSV:** PapaParse parser
- **Excel:** xlsx library (.xlsx, .xls)

### Features
- Automatic column detection
- Arabic/English header mapping
- Data validation with Zod schemas
- Bulk import with transaction support

### Column Mapping
- Arabic headers: جهة, عنوان المنافسة, رقم المنافسة, etc.
- English headers: Entity, Title, Reference No., etc.
- Automatic field mapping and validation

---

## 🧪 Testing

### Test Framework
- **Playwright:** E2E testing
- **Test Directory:** `./tests/e2e`
- **Browsers:** Chromium (Desktop Chrome)

### Test Coverage
- File upload flow
- Tender import validation
- Dashboard navigation
- Error handling

---

## 🔧 Build Configuration

### Next.js Config
- **App Router:** Enabled
- **Server Actions:** 10MB body size limit
- **Internationalization:** next-intl plugin
- **Static Generation:** Supported for all routes

### TypeScript Config
- **Strict Mode:** Enabled
- **Target:** ES2017
- **Module:** ESNext
- **JSX:** react-jsx
- **Path Aliases:** `@/*` → `./*`

### PostCSS Config
- **Plugin:** @tailwindcss/postcss
- **Tailwind CSS:** v4.1.18

### Tailwind Config
- **Dark Mode:** Class-based
- **Content:** app/, components/, lib/
- **RTL Support:** Native via Tailwind v4

---

## 📦 Build Scripts

```json
{
  "predev": "Clean Next.js lock files",
  "dev": "Start development server (port 3000)",
  "dev:force": "Force start on port 3000",
  "build": "Production build",
  "start": "Start production server",
  "lint": "Run ESLint",
  "type-check": "TypeScript type checking",
  "test": "Run Playwright tests",
  "test:ui": "Run Playwright with UI"
}
```

---

## 🚀 Build Status

### Last Successful Build
- **Status:** ✅ Success
- **Build Time:** ~11.3s compilation
- **Static Pages:** 19 routes generated
- **TypeScript:** ✅ No errors

### Routes Generated
- **Static (○):** 1 route (root)
- **SSG (●):** 18 routes (with generateStaticParams)
- **Dynamic (ƒ):** 2 routes (tender detail, push success)
- **Middleware:** Proxy for i18n routing

### Warnings
- ⚠️ Invalid `turbo` key in next.config.ts experimental (non-critical)
- ⚠️ Database column `estimated_value` referenced but may not exist in all environments

---

## 🔐 Security Features

### Authentication
- **Provider:** Supabase Auth
- **Session Management:** Server-side via @supabase/ssr
- **User Isolation:** RLS policies enforce user-scoped data access

### Data Validation
- **Zod Schemas:** All inputs validated
- **Type Safety:** Full TypeScript coverage
- **Server Actions:** Type-safe server-side operations

---

## 📈 Key Features

### Core Functionality
1. **Tender Management**
   - Import from CSV/Excel
   - Manual entry
   - Bulk operations
   - Status tracking

2. **AI Evaluation**
   - Automated scoring
   - Recommendation generation
   - Arabic summaries
   - Risk analysis

3. **Dashboard**
   - Statistics overview
   - Tender table with filtering
   - Status badges
   - Quick actions

4. **CRM Integration**
   - Multi-provider support
   - Push qualified tenders
   - Push history tracking
   - Error handling

5. **Settings**
   - CRM configuration
   - Theme toggle (light/dark)
   - Language toggle (ar/en)

---

## 🎯 Performance Considerations

### Optimization
- **Server Components:** Default (reduces client bundle)
- **Static Generation:** All public routes
- **Code Splitting:** Automatic via Next.js
- **Image Optimization:** Next.js Image component ready

### Bundle Size
- **Dependencies:** 487 packages
- **Production Build:** Optimized with tree-shaking
- **CSS:** Tailwind v4 with JIT compilation

---

## 🔄 Development Workflow

### Local Development
1. `pnpm install` - Install dependencies
2. `pnpm dev` - Start dev server (port 3000)
3. Access: `http://localhost:3000`

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side)
- `OPENAI_API_KEY` - OpenAI API key (or alternative AI provider)

---

## 📝 Code Quality

### TypeScript
- **Strict Mode:** ✅ Enabled
- **Type Coverage:** Full (no `any` types in core code)
- **Path Aliases:** Configured (`@/*`)

### Linting
- **ESLint:** 9.39.2
- **Config:** eslint-config-next
- **Rules:** Next.js recommended

### Code Organization
- **Server Actions:** Separated in `actions/` directory
- **Database Queries:** Centralized in `lib/queries/`
- **Components:** Organized by feature/domain
- **Types:** Centralized in `types/` directory

---

## 🐛 Known Issues

1. **Database Column:** `estimated_value` column may not exist in all database instances (migration needed)
2. **Next.js Config:** Invalid `turbo` key in experimental (non-breaking, can be removed)

---

## 📊 Statistics

- **Total Source Files:** ~100+ TypeScript/TSX files
- **Components:** 31 React components
- **Pages:** 18 Next.js pages
- **Server Actions:** 3 action files
- **Database Tables:** 4 tables
- **Database Indexes:** 9 indexes
- **RLS Policies:** 12+ policies
- **Supported Languages:** 2 (Arabic, English)
- **CRM Providers:** 2 implemented (webhook, hubspot)

---

## ✅ Build Verification

### Successful Build Output
```
✓ Compiled successfully in 11.3s
✓ Running TypeScript ...
✓ Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (19/19) in 2.3s
✓ Finalizing page optimization ...
```

### Route Generation
- All static routes generated successfully
- Dynamic routes configured correctly
- Middleware proxy functioning

---

## 🎓 Architecture Patterns

### Server Actions Pattern
```typescript
export type ActionResponse<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

### Database Query Pattern
- Service role client for admin operations
- User-scoped queries with RLS
- Type-safe queries with generated types

### Component Pattern
- Server Components by default
- Client Components only when needed (`'use client'`)
- Shared UI components in `components/ui/`

---

## 📋 Dependencies Summary

### Production (14)
- Core: next, react, react-dom
- UI: @radix-ui/themes, lucide-react, next-themes
- Backend: @supabase/ssr, @supabase/supabase-js
- AI: ai, @ai-sdk/openai
- i18n: next-intl
- Data: papaparse, xlsx, zod, date-fns
- Utils: clsx, tailwind-merge, react-dropzone

### Development (8)
- TypeScript: typescript, @types/*
- Styling: tailwindcss, @tailwindcss/postcss
- Testing: @playwright/test
- Linting: eslint, eslint-config-next

---

## 🔗 External Integrations

1. **Supabase**
   - Database (PostgreSQL)
   - Authentication
   - Row Level Security

2. **OpenAI / AI Providers**
   - Tender evaluation
   - Natural language processing

3. **CRM Systems**
   - HubSpot API
   - Generic webhooks

---

## 📌 Next Steps / Recommendations

1. **Database Migration:** Add `estimated_value` column migration if not present
2. **Remove Invalid Config:** Clean up `turbo` key from next.config.ts
3. **Environment Setup:** Ensure all required env vars are configured
4. **Testing:** Expand E2E test coverage
5. **Documentation:** Add API documentation for server actions

---

**Report Generated:** January 26, 2026  
**Build Status:** ✅ Production Ready  
**Last Commit:** a9d2caf
