# RTL & Arabic UI Best Practices Skill
# Source: Adapted from web-design-guidelines + RTL research

## Purpose
Ensure perfect RTL (Right-to-Left) support for Arabic interface with proper icon flipping, layout mirroring, and text rendering.

## Core Principles

### 1. HTML Direction Attribute
```typescript
// ✅ CORRECT: Set dir in root layout
export default function RootLayout({ children, params: { locale } }) {
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  )
}
```

### 2. Tailwind CSS Logical Properties
```tsx
// ✅ CORRECT: Use logical properties
<div className="ms-4 me-2 ps-6 pe-4 start-0 end-auto">
  {/* ms = margin-start, me = margin-end */}
  {/* ps = padding-start, pe = padding-end */}
</div>

// ❌ WRONG: Direction-specific properties
<div className="ml-4 mr-2 pl-6 pr-4 left-0 right-auto">
  {/* These don't flip in RTL */}
</div>
```

### 3. Icon Flipping
```tsx
// ✅ CORRECT: Auto-flip icons based on direction
import { ChevronRight } from 'lucide-react'

<ChevronRight className={cn(
  "transition-transform",
  locale === 'ar' && "rotate-180"
)} />

// Or use CSS
.icon-arrow {
  transform: scaleX(1);
}
[dir="rtl"] .icon-arrow {
  transform: scaleX(-1);
}
```

### 4. Text Alignment
```tsx
// ✅ CORRECT: Use logical alignment
<p className="text-start">Arabic text starts from right</p>

// ❌ WRONG: Hardcoded alignment
<p className="text-right">This breaks in LTR</p>
```

### 5. Flexbox & Grid
```tsx
// ✅ CORRECT: Use logical properties
<div className="flex flex-row-reverse">
  {/* Or use CSS Grid with logical properties */}
</div>

// Better: Use Tailwind's RTL variant
<div className="flex rtl:flex-row-reverse">
  {/* Automatically applies in RTL */}
</div>
```

### 6. Font Loading
```typescript
// ✅ CORRECT: Load Arabic font properly
import { IBM_Plex_Sans_Arabic } from 'next/font/google'

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
})

// Apply in layout
<body className={ibmPlexArabic.variable}>
```

### 7. Number Formatting
```typescript
// ✅ CORRECT: Use locale-aware formatting
const formatter = new Intl.NumberFormat('ar-SA', {
  style: 'currency',
  currency: 'SAR',
})

formatter.format(1234.56) // "١٬٢٣٤٫٥٦ ر.س"
```

### 8. Date Formatting
```typescript
// ✅ CORRECT: Use locale-aware dates
const dateFormatter = new Intl.DateTimeFormat('ar-SA', {
  dateStyle: 'long',
})

dateFormatter.format(new Date()) // "٢٤ يناير ٢٠٢٦"
```

## Component Patterns

### RTL-Aware Button
```tsx
export function Button({ children, icon: Icon, ...props }) {
  const { locale } = useLocale()
  const isRTL = locale === 'ar'
  
  return (
    <button {...props}>
      {Icon && (
        <Icon className={cn(
          "transition-transform",
          isRTL && "rotate-180"
        )} />
      )}
      {children}
    </button>
  )
}
```

### RTL-Aware Card
```tsx
export function Card({ children, className }) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-6",
      "ms-4 me-2", // Logical margins
      className
    )}>
      {children}
    </div>
  )
}
```

## Testing Checklist
- [ ] All icons flip correctly in RTL
- [ ] Text alignment is correct (start/end, not left/right)
- [ ] Margins and padding flip correctly
- [ ] Forms align properly (labels on correct side)
- [ ] Tables have correct column order
- [ ] Navigation menus open from correct side
- [ ] Modals/drawers slide from correct side
- [ ] Numbers display in Arabic-Indic numerals (optional)

## Common Mistakes to Avoid
- ❌ Using `ml-`, `mr-`, `pl-`, `pr-` instead of logical properties
- ❌ Hardcoding `text-right` or `text-left`
- ❌ Not flipping arrow/chevron icons
- ❌ Using `left:` and `right:` in CSS instead of `start:` and `end:`
- ❌ Not testing both `/ar` and `/en` routes
- ❌ Assuming all users want Arabic-Indic numerals (ask preference)

## Resources
- Tailwind RTL Plugin: `tailwindcss-rtl` (if needed, but Tailwind v4 has native support)
- next-intl RTL docs: https://next-intl-docs.vercel.app/docs/routing/rtl
- IBM Plex Sans Arabic: https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic
