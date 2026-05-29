# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server at localhost:4321
pnpm build      # Build to ./dist/
pnpm preview    # Preview production build
pnpm astro check  # TypeScript / Astro type check
```

No test suite is configured. Type-check with `pnpm astro check`.

## Environment

Copy `.env.example` to `.env` and fill in:

```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Stack:** Astro 6 (static shell) + React 19 (islands) + Tailwind CSS v4 + Supabase (auth + DB) + TanStack Query v5.

**Page rendering pattern:** Each Astro page in `src/pages/` is a thin shell that mounts a React `*PageWrapper` component with `client:load`. The wrapper applies one of two shell components:

- `AppShell` (authenticated pages): `QueryProvider → AuthProvider → AuthGuard → AppLayout`
- `AuthShell` (login/register): `QueryProvider → AuthProvider`

**Data layer:** All Supabase access happens inside TanStack Query hooks in `src/hooks/`. Each hook calls `createClient()` directly (a new browser client per call) and exposes `useQuery`/`useMutation` results. After mutations, the hook invalidates its own query keys — no global cache management elsewhere.

**Supabase views used as read sources:** `habit_progress`, `weekly_summary`, `activity_habit_matrix` — these are DB views, not tables. Don't try to insert/update them.

**Form validation:** All inputs are validated client-side with Zod schemas defined in `src/lib/validators.ts`. Types exported from `src/types/index.ts`.

**Path alias:** `@/*` resolves to `src/*` (configured in `tsconfig.json`).

## Styling Rules

Tailwind CSS v4 is configured as a Vite plugin. Design tokens (colors, radii, shadows, fonts) live in `src/styles/global.css` under `@theme`.

- **Dark mode:** Toggled by adding the `.dark` class to `<html>`. CSS custom properties handle the switch automatically.
- **Do NOT use `dark:` Tailwind prefix for CSS variable-based values** — it will not work. Only use `dark:` for hardcoded Tailwind color utilities when no CSS variable exists.
- Use `var(--color-*)`, `var(--radius-*)`, `var(--shadow-*)` tokens rather than arbitrary values.
- UI language is **Spanish** — all user-facing strings should be in Spanish.

Key design tokens (from DESIGN.md):

| Purpose | Token |
|---------|-------|
| Page background | `var(--color-bg)` |
| Card surface | `var(--color-surface)` |
| Primary accent | `var(--color-accent)` (#E0653B terracota) |
| Muted text | `var(--color-text-muted)` |

Utility classes defined in `global.css`: `.page-enter`, `.stagger-enter`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`, `.focus-ring`.

## UI Component Conventions

Reusable primitives live in `src/components/ui/`: `Button`, `Card`, `MetricCard`, `Modal`, `Tabs`.

- **Card** variants: `default`, `flat`, `interactive`
- **Button** variants: `primary`, `secondary`, `danger`, `ghost`, `success`; sizes: `sm`, `md`, `lg`
- **Tabs** variants: `underline`, `pills`
- **MetricCard**: label (11px uppercase) + value (1.75rem bold) + optional trend/icon

Page header pattern: icon badge (`w-9 h-9`, `bg-color/8`) + title (1.65rem) + subtitle (13px muted, `ml-50px`).
