# Dependency & Version Audit

**Date:** 2026-02-02  
**Purpose:** Verify framework version and proxy/middleware convention before architecture changes.

---

## 1. Framework Version

| Package | Declared (package.json) | Notes |
|---------|-------------------------|--------|
| **next** | `^16.1.4` | Next.js 16.x — **correct**. Official docs (nextjs.org) state that starting with Next.js 16, Middleware is now called Proxy. |
| **react** | `^19.0.0` | React 19.x — **correct** for Next.js 16. |
| **react-dom** | `^19.0.0` | Matches React. |

**Conclusion:** The project is on **Next.js 16** and **React 19**. No change needed for framework version.

---

## 2. Proxy Implementation (Next.js 16 Standard)

### 2.1 File name and location

| Check | Status | Details |
|------|--------|---------|
| **Filename** | ✅ Correct | Next.js 16 expects **`proxy.ts`** (or `proxy.js`), not `middleware.ts`. The project has **`proxy.ts`** at the project root (same level as `app/`). |
| **Location** | ✅ Correct | Convention: "Create a proxy.ts file in the project root, or inside src if applicable" (Next.js docs). Root is valid. |

### 2.2 Export name and signature

| Check | Status | Details |
|------|--------|--------|
| **Export** | ✅ Correct | Project uses **named export**: `export async function proxy(request: Request)`. Next.js 16 accepts either a **named `proxy` export** or a **default export** (e.g. `export default function proxy(request) { ... }`). Named `proxy` is explicitly valid per docs. |
| **Legacy** | N/A | `export function middleware(request)` would be the old Middleware convention; in v16 the convention is **proxy** (file name and export name). |

**Conclusion:** **`proxy.ts` is correctly named and implemented for Next.js 16.** The proxy runs as the framework entry point; it is **not** dead code. The earlier "State of the Build" report was incorrect in stating that the proxy is never invoked because there is no `middleware.ts` — in v16, **proxy.ts** is the active convention and is used by the framework.

---

## 3. Config Compatibility (Next.js 16)

| Item | Status | Details |
|------|--------|--------|
| **experimental.turbo** | ✅ Handled | Not present in the config object. `stripTurboFromConfig()` strips `experimental.turbo` if a plugin adds it (comment references v16: "use top-level `turbopack`"). No deprecated key in the final config. |
| **experimental.serverActions.bodySizeLimit** | ✅ Valid | `'10mb'` for server actions is supported in Next.js 16. |
| **next-intl plugin** | ✅ | `createNextIntlPlugin()` used as in next-intl docs; no conflict with proxy. |

**Conclusion:** **next.config.ts is compatible with Next.js 16.** No deprecated keys that would break the build.

---

## 4. Other Dependencies (Spot Check)

| Package | Version | Note |
|---------|--------|------|
| next-intl | ^3.25.0 | Current major; works with App Router and middleware/proxy. |
| @supabase/ssr | ^0.5.2 | Usable with proxy for cookie-based auth. |
| react / react-dom | ^19.0.0 | Matches Next.js 16 expectations. |
| eslint-config-next | ^16.0.0 | Aligned with Next 16. |
| typescript | ^5.7.0 | Current. |
| tailwindcss | ^4.0.0 | Tailwind v4. |
| @tailwindcss/postcss | ^4.0.0 | Matches. |

Nothing in the scanned set is obviously outdated for this stack. Optional: run `pnpm outdated` (or similar) for a full list of newer versions.

---

## 5. Audit Summary

| Question | Answer |
|----------|--------|
| **Exact Next.js version?** | **16.x** (declared `^16.1.4` in package.json). |
| **Is proxy.ts correctly named and implemented for that version?** | **Yes.** File is `proxy.ts` at project root; export is `export async function proxy(request: Request)`. Both match Next.js 16 convention. |
| **Deprecated config keys?** | **No.** Config is v16-compatible; `experimental.turbo` is stripped if present. |
| **Other dependencies outdated?** | **None** flagged in this audit; versions are appropriate for Next 16 + React 19. |

---

## 6. Correction to Previous "State of the Build" Report

The **State of the Build** report stated:

- "There is **no** middleware.ts … **proxy.ts** … is **never invoked** because Next.js only runs a file named middleware.ts."

**Correction for Next.js 16:** Next.js 16 uses **proxy.ts** (not middleware.ts) as the convention. The project has **proxy.ts** at the root with the correct **proxy** export, so the proxy **is** invoked by the framework. Session refresh and route protection in proxy.ts **are active**. The only remaining recommendation from that report that still applies is the optional locale-aware redirect in `requireAuth()` (e.g. pass `/${locale}/login` so redirect preserves locale). Dashboard protection is in place both in **proxy** (redirect unauthenticated users) and in **layout** (`requireAuth()`).

---

*Audit based on: package.json, proxy.ts, next.config.ts, and Next.js 16 official documentation (nextjs.org/docs/app/getting-started/proxy).*
