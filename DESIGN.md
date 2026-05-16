---
version: alpha
name: Habit Tracker Design System
---

## Overview

Spanish-language habit tracking and pomodoro timer app built with Astro + React + Tailwind CSS v4 + Supabase. Clean, minimal interface with Geist font family, warm neutral palette, and a single accent color for primary actions.

## Colors

| Token | Light | Dark |
|-------|-------|------|
| bg | `#F6F5F2` | `#0A0A0B` |
| surface | `#FFFFFE` | `#131316` |
| surface-raised | `#FFFFFE` | `#1A1A1F` |
| border | `#E4E2DD` | `#232328` |
| text | `#171717` | `#ECECEA` |
| text-muted | `#6F6E6B` | `#989894` |
| accent | `#2D5BFF` | `#2D5BFF` |
| accent-hover | `#1A47E8` | `#1A47E8` |
| success | `#0A8F62` | `#0A8F62` |
| warning | `#C07D15` | `#C07D15` |
| danger | `#D43030` | `#D43030` |
| info | `#0C8AA8` | `#0C8AA8` |

Dark mode is handled via `.dark` class on `<html>`. CSS custom properties auto-switch; do NOT use Tailwind `dark:` prefix with CSS variable values.

## Typography

- **Display / Body:** Geist, Satoshi, system-ui
- **Mono:** Geist Mono, JetBrains Mono
- **Headings:** font-bold, tracking-tight
- **Body:** 13-14px base, 1.5 line-height
- **Labels:** 11px, uppercase, tracking-0.06em, text-muted

## Radii

| Token | Value |
|-------|-------|
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 20px |
| full | 9999px |

## Shadows

| Token | Light | Dark |
|-------|-------|------|
| xs | 0 1px 2px rgba(0,0,0,0.04) | 0 1px 2px rgba(0,0,0,0.2) |
| sm | 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04) | deeper dark variant |
| md | 0 4px 6px -1px rgba(0,0,0,0.06) | deeper |
| lg | 0 10px 15px -3px rgba(0,0,0,0.06) | deeper |
| xl | 0 20px 25px -5px rgba(0,0,0,0.08) | deeper |

## Spacing

Page max-width: `5xl` (64rem). Section gap: `6` (1.5rem). Card padding: `5` (1.25rem). Content margins: `px-4 sm:px-6 lg:px-8 py-8`.

## Components

### Card
Three variants: `default` (border + shadow-sm), `flat` (border only), `interactive` (hover shadow-md, cursor-pointer). Optional 3px left accent border.

### MetricCard
Card with label (11px uppercase), value (1.75rem bold), optional trend indicator, optional icon badge.

### Button
Variants: `primary` (accent bg), `secondary` (border), `danger`, `ghost`, `success`. Sizes: sm/md/lg. Active scale 0.97.

### Tabs
Two variants: `underline` (animated bottom border) and `pills` (rounded bg toggle).

### Modal
Backdrop blur, `modalIn` animation, Escape key close, focus trap, ARIA dialog role.

### Sidebar
260px fixed width. Active nav item: accent bg with white text and small dot indicator. Hover: subtle bg + icon scale. Mobile: hamburger + overlay + slide-in.

## Animations

| Name | Use |
|------|-----|
| fadeIn | Page/section entrance (400ms) |
| fadeInUp | Metric cards, heavier content |
| modalIn | Modal entrance (250ms, cubic-bezier 0.16, 1, 0.3, 1) |
| countUp | Metric value reveal |
| pulse-subtle | Emoji/icon attention |
| shimmer | Skeleton loading |

## Patterns

- Page headers: icon badge (w-9 h-9, bg-color/8) + title (1.65rem) + subtitle (13px muted, ml-50px)
- Action buttons: 13px font-semibold, shadow-sm, active scale
- Status badges: 2xs font-medium uppercase, rounded-full — use `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`
- Filter chips: px-3 py-1.5, text-xs, rounded-full, accent when active
- Loading skeletons: use `bg-[var(--color-border)]` with `rounded-[var(--radius-lg)]`
- Error/success alerts: use `bg-[var(--color-danger-soft)]` / `bg-[var(--color-success-soft)]` with matching border and text colors
- Page entrance: `page-enter` class (fadeIn 0.35s)
- Stagger children: `stagger-enter` class (fadeInUp with 60ms delay per child)

## Utility Classes

| Class | Use |
|-------|-----|
| `.page-enter` | Page/section entrance animation |
| `.stagger-enter` | Staggered child entrance (60ms increments) |
| `.badge-success` | Green status badge |
| `.badge-warning` | Amber status badge |
| `.badge-danger` | Red status badge |
| `.badge-info` | Blue status badge |
| `.focus-ring` | Accessible focus outline |

## EDITMODE Defaults

```json
{
  "accentColor": "#2D5BFF",
  "radiusScale": 1,
  "density": 1
}
```

## Dark Mode

CSS custom properties auto-switch via `.dark` class on `<html>`. Do NOT use Tailwind `dark:` prefix with CSS variable values — the variables handle it. Only use `dark:` for hardcoded Tailwind color utilities like `dark:bg-gray-800` when no CSS variable exists.

Shadows in dark mode override to `rgba(255,255,255,...)` (in `.dark` selector in global.css) so they remain visible on dark surfaces.

## Routing (Astro Pages)

| Route | Page | Content |
|-------|------|---------|
| `/` | `index.astro` | AuthPage (login/register) |
| `/dashboard` | `dashboard.astro` | DashboardContent (KPIs + charts) |
| `/habits` | `habits.astro` | HabitsContent (CRUD list) |
| `/actividades` | `actividades.astro` | ActivitiesContent (CRUD) |
| `/sessions` | `sessions.astro` | SessionsContent (log) |
| `/temporizador` | `temporizador.astro` | TimerContent (pomodoro) |

Each page uses a `*PageWrapper` component that wraps content in `AppShell` (QueryProvider → AuthProvider → AuthGuard → AppLayout).
