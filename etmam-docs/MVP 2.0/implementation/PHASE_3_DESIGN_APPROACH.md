# Phase 3 Design Approach: Skills-Based Design

**Date:** 2026-01-27  
**Status:** 📋 Design Strategy Document

---

## 🎯 Core Principle

**Design components and tokens based on skills learned, NOT layout specifications from the plan.**

The plan provides functional requirements (WHAT to build). The skills provide design direction (HOW to build it).

---

## ❌ What We Will IGNORE from the Plan

### Layout Structures
- ❌ 2-column grid layout specifications
- ❌ Kanban board 4-column structure
- ❌ Specific layout diagrams and ASCII mockups
- ❌ Column width ratios and positioning

### Visual Design Specifications
- ❌ "Ministry Clean" / "Midnight Operator" aesthetic descriptions
- ❌ Specific color hex codes (#06b6d4, #8b5cf6, etc.)
- ❌ Typography choices (IBM Plex Sans Arabic)
- ❌ Spacing values (4px base unit)
- ❌ Specific shadow/elevation specs
- ❌ Font size scales from plan

### Component Styling Details
- ❌ Specific component styling instructions
- ❌ Border radius values from plan
- ❌ Transition duration values from plan
- ❌ Specific hover effect descriptions

### Visual Mockups
- ❌ ASCII layout diagrams
- ❌ Component placement instructions
- ❌ Visual hierarchy specifications from plan

---

## ✅ What We Will DESIGN Based on Skills

### Design System (from `frontend-design` + `design-system-creation`)

1. **Aesthetic Direction**
   - Choose BOLD, distinctive aesthetic (not generic)
   - Select unique typography pair (avoid Inter, Roboto, Arial, system fonts)
   - Define cohesive color palette with dominant colors + sharp accents
   - Create memorable visual identity

2. **Typography System**
   - Distinctive display font + refined body font
   - Type scale with proper ratios
   - Line heights optimized for readability
   - RTL-aware font families
   - **NOT using:** IBM Plex Sans Arabic (from plan)

3. **Color System**
   - Routing colors with semantic meaning (INFRATECH, EXOTECH, JOINT, NO_BID)
   - Primary/secondary/neutral palettes
   - Dark mode variants
   - Semantic colors (success/warning/error/info)
   - **NOT using:** Specific hex codes from plan

4. **Spacing System**
   - Base unit system (may not be 4px)
   - Semantic spacing tokens
   - Consistent spacing scale
   - **NOT using:** Specific spacing values from plan

5. **Motion & Animation**
   - Transition durations and easing functions
   - Animation patterns (staggered reveals, hover effects)
   - Respect `prefers-reduced-motion`
   - High-impact moments, not scattered micro-interactions

6. **Elevation & Shadows**
   - Shadow system for depth hierarchy
   - Elevation levels
   - Glass effects if needed
   - Dramatic shadows for atmosphere

### Component Architecture (from `frontend-design` + `vercel-react-best-practices`)

1. **Layout Structures**
   - Design based on responsive-web-design principles
   - Mobile-first approach
   - Unexpected layouts, asymmetry, diagonal flow
   - Grid-breaking elements
   - **NOT using:** 2-column grid, 4-column Kanban from plan

2. **Component Structure**
   - Server Components by default (Next.js 16)
   - Client Components only for interactivity
   - Performance optimized (React.memo, CSS animations)
   - Proper component composition

3. **Visual Hierarchy**
   - Spatial composition principles
   - Generous negative space OR controlled density
   - Unexpected layouts
   - Clear visual hierarchy

### Interaction Patterns (from `interaction-design`)

1. **Loading States**
   - Skeleton loaders
   - Progressive loading
   - Smooth transitions

2. **Error States**
   - User-friendly error messages
   - Recovery paths
   - Clear feedback

3. **Empty States**
   - Helpful messaging
   - Actionable CTAs
   - Visual interest

4. **Microinteractions**
   - Hover effects that surprise
   - Scroll-triggering animations
   - Smooth state transitions

### Responsive Design (from `responsive-web-design` + `mobile-first-design`)

1. **Breakpoints**
   - Mobile-first approach
   - Responsive grid layouts
   - Adaptive typography
   - Touch-friendly targets (≥48x48px)

2. **Layout Adaptation**
   - Stack on mobile, side-by-side on desktop
   - Flexible grid systems
   - Content reflow strategies

### Dashboard Design (from `kpi-dashboard-design`)

1. **Dashboard Layout**
   - Proper metric selection
   - Visual hierarchy
   - Data visualization best practices
   - **NOT using:** Specific Kanban layout from plan

---

## 📋 What We Will KEEP from the Plan

### Functional Requirements
- ✅ Component names and file paths
- ✅ Feature requirements (what each component should do)
- ✅ Data structures and TypeScript interfaces
- ✅ Database query requirements
- ✅ Component props and interfaces

### Component List
- ✅ OfficialDataPanel (functionality, not layout)
- ✅ OracleInsightsPanel (functionality, not layout)
- ✅ InferredScopeList (expandable functionality)
- ✅ ReasoningChain (3-stage display)
- ✅ RoutingKanban (4 routing types, not layout)
- ✅ RoutingColumn (reusable component)
- ✅ SmartTenderCard (already implemented)

### Data Requirements
- ✅ Oracle metadata structure
- ✅ Routing decision types
- ✅ Budget calculation methods
- ✅ Confidence scores
- ✅ Scope item structure

---

## 🎨 Design Process

1. **Learn Skills First**
   - Read all required skills
   - Understand design principles
   - Note aesthetic guidelines

2. **Design System Creation**
   - Choose aesthetic direction (bold, distinctive)
   - Create color palette (NOT from plan)
   - Select typography (NOT from plan)
   - Define spacing system (NOT from plan)
   - Create motion/animation tokens

3. **Component Design**
   - Design based on skills, not plan layouts
   - Apply frontend-design principles
   - Use interaction-design patterns
   - Optimize with vercel-react-best-practices

4. **Verification**
   - RTL support
   - Responsive design
   - Accessibility (WCAG 2.1 AA)
   - Performance optimization
   - TypeScript compilation

5. **Code Review**
   - Review using code-review-excellence skill
   - Check for bugs, performance, maintainability
   - Verify architectural fit

---

## 🚀 Implementation Order

1. **Skill Learning Phase** (30 min)
   - Read all 8 required skills
   - Understand design principles

2. **Design System Creation** (1-2 hours)
   - Design tokens based on skills
   - Create logo design
   - Update globals.css and tokens.css

3. **Task 3.1 Review** (30 min)
   - Code review existing Smart Tender Card
   - Apply fixes if needed

4. **Task 3.2: Detailed Oracle View** (3-4 hours)
   - Build components based on skills
   - Design layout (NOT from plan)

5. **Task 3.3: Routing Dashboard** (2-3 hours)
   - Build components based on skills
   - Design layout (NOT from plan)

6. **Verification Phase** (1-2 hours)
   - RTL, responsive, accessibility, performance

7. **Code Review Phase** (1-2 hours)
   - Review all components
   - Apply fixes

**Total Estimated Time:** 9-13 hours

---

## ✅ Success Criteria

**Phase 3 is complete when:**

✅ All 3 tasks implemented  
✅ Design follows skills-learned aesthetic (NOT plan aesthetic)  
✅ RTL support verified  
✅ Responsive on all breakpoints  
✅ Accessibility audit passes  
✅ Performance targets met  
✅ TypeScript compilation passes  
✅ Visual design is distinctive and memorable (not generic AI aesthetics)  
✅ Code review completed for all components  
✅ All verification checks pass

---

**Key Principle:** Skills guide design. Plan provides requirements.
