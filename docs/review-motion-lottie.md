# Review: Framer Motion & Lottie Demo (vs Official Docs)

Review performed against Motion (motion.dev) and lottie-react (lottiereact.com) documentation. Gaps fixed below.

## Sources

- **Motion**: [motion.dev/docs](https://motion.dev/docs) — useReducedMotion, AnimatePresence, motion component, variants.
- **Lottie**: [lottiereact.com](https://lottiereact.com) — Lottie component props, lottieRef, goToAndStop, autoplay, onDataReady.

## Fixes Applied

### 1. `lib/motion.ts`

- **Doc alignment**: Added comment that Motion docs use package `"motion"` and import from `"motion/react"`; this project uses `framer-motion`. We keep a matchMedia-based reduced-motion check so we don’t depend on the package’s hook and stay compatible with both.
- **WCAG**: Comment updated to reference WCAG 2.2 for reduced motion.

### 2. `components/demo/demo-lottie.tsx`

- **autoplay**: Set `autoplay={!reduceMotion}` so when reduced motion is on the animation never starts (per lottie-react props).
- **Ref timing**: When reduced motion is on, the ref can be set after the first commit. Added `onDataReady` to call `goToAndStop(0, true)` as soon as the animation is ready so we always show frame 0 without a flash.

### 3. `components/demo/demo-kpi-motion.tsx`

- **A11y**: Added `aria-label="Increment demo KPI value by 1"` on the +1 button for screen readers (WCAG AA).

### 4. `components/demo/demo-motion-page-client.tsx`

- **RTL**: Back link arrow is direction-aware: `→` for Arabic (RTL), `←` for English (LTR). Arrow wrapped in `<span aria-hidden="true">` so it’s not read twice.
- **A11y**: Added `aria-label="Back to Dashboard"` on the back link.

## Verified (No Change)

- **AnimatePresence**: Used with a single child and `key={count}`; exit/enter behavior matches docs. `mode="wait"` is correct for one child.
- **Variants**: Container with `staggerChildren` and item variants with `hidden`/`show` match Motion’s variant pattern.
- **framer-motion**: Imports from `framer-motion` (motion, AnimatePresence) are correct for the installed package.
- **Lottie ref**: `lottieRef` prop and `LottieRefCurrentProps` with `goToAndStop(value, isFrame)` match lottie-react types and docs.
- **Reduced motion**: All motion (KPI value change, list stagger, list hover, Lottie) is gated by `useMotionConfig().reduceMotion` or equivalent.

## TypeScript & Lint

- `pnpm run type-check` passes.
- No new linter issues in touched files.
