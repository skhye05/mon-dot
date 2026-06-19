# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

> See also `AGENTS.md` (Next.js 16 has breaking changes vs. older versions — verify APIs against `node_modules/next/dist/docs/` when present) and `HANDOFF.md` (current status of the "La Dot" dashboard work).

## What this is

`mon-dot` is a **pnpm + Turborepo** monorepo built from the shadcn/ui monorepo template. The app currently hosts a single feature: **the "La Dot · Famille Mbenoun" purchase dashboard** — a budget tracker for a Cameroonian dowry (dot) where the user checks off items and records real prices (edited via a dialog) vs. estimates.

## Stack

- **Next.js 16.2.6** (App Router) · **React 19.2.4**
- **Tailwind CSS v4** (CSS-first config via `@theme` in `packages/ui/src/styles/globals.css`)
- **shadcn/ui**, style `radix-mira`, base color `neutral`, CSS variables, oklch tokens
- **Icons:** `@tabler/icons-react`
- **Data table:** `@tanstack/react-table` (powers the items table — `apps/web/components/dashboard/items-table.tsx`)
- **Charts:** `recharts` via the shadcn `chart` primitive (`@workspace/ui/components/chart`); chart compositions (donuts, bars) in `apps/web/components/dashboard/charts.tsx`
- **Theme:** `next-themes` (light/dark; `d` key toggles dark mode globally, see `apps/web/components/theme-provider.tsx`)
- **Package manager:** pnpm `10.33.4` · Node `>=20`

## Layout

```
apps/web/                 # the Next.js app
  app/                    # App Router (page.tsx renders <DotDashboard/>)
  components/
    dashboard/            # dot-dashboard.tsx (orchestrator: KPIs/charts/recap), items-table.tsx
                          #   (TanStack data table + edit dialog), charts.tsx,
                          #   predot.tsx (standalone "Pré-dot" expense ledger)
    theme-provider.tsx
  lib/dot-data.ts         # typed items + compute()/fmt() + localStorage seed
packages/ui/              # @workspace/ui — shared shadcn package
  src/components/         # ALL shadcn primitives live here (button, card, badge, input, table,
                          #   progress, checkbox, select, dialog, label, chart) — @workspace/ui/components/<name>
  src/lib/utils.ts        # cn()
  src/styles/globals.css  # Tailwind v4 theme + tokens
packages/eslint-config/   # @workspace/eslint-config
packages/typescript-config/
```

## Commands (run from repo root)

```bash
pnpm dev          # turbo dev (Next dev server for web)
pnpm build        # turbo build
pnpm lint         # eslint across workspace
pnpm typecheck    # tsc --noEmit across workspace
pnpm format       # prettier
```

Per-app: `cd apps/web && pnpm dev|build|typecheck`. After changes, prefer `pnpm typecheck` (fast, no SWC needed) plus `pnpm lint`.

## Path aliases

- `@/*` → `apps/web/*` (e.g. `@/components/dashboard/charts`, `@/lib/dot-data`)
- `@workspace/ui/*` → `packages/ui/src/*` (e.g. `@workspace/ui/components/button`, `@workspace/ui/lib/utils`)

## Conventions

- **Components use the radix-mira aesthetic established by `packages/ui/src/components/button.tsx`:** `data-slot` attributes, compact sizing (`h-7`, `text-xs`), `cn()` for class merging, oklch design tokens (`bg-card`, `text-muted-foreground`, `border`, etc.). Match it when adding components.
- **Where components go:** every shadcn UI primitive lives in `packages/ui/src/components` (imported as `@workspace/ui/components/<name>`), matching the `ui` alias in both `components.json` files and how `button` works. App-specific *composite* components (the dashboard, charts) live in `apps/web/components/dashboard`. Do **not** reintroduce an `apps/web/components/ui` folder — primitives belong in the shared package.
- **Interactive components need `"use client"`** (the dashboard is client-side; the page is a server component that renders it).
- Use **semantic Tailwind palette colors with dark variants** for status accents (e.g. `text-emerald-600 dark:text-emerald-400`); the base theme tokens are intentionally neutral/monochrome.

## Important gotchas

1. **`shadcn add` does NOT work for the `radix-mira` style** — that registry returns `401 Unauthorized` without credentials. To add a primitive, either supply registry auth, or hand-write the component in `packages/ui/src/components` to match `button.tsx`. Every primitive here (incl. the Radix-based `checkbox`/`select`) was hand-built this way.
2. **`apps/web` does not depend on `class-variance-authority` or `radix-ui` directly** — those are deps of `packages/ui`, where all primitives now live. Keep Radix/CVA imports inside `packages/ui`; app code only imports the finished `@workspace/ui/components/<name>`.
3. **Next 16 SWC binary is platform-specific and fetched from npm on first build/dev.** Only `@next/swc-darwin-arm64` is installed (macOS). Builds on other architectures or offline will fail with "Failed to load SWC binary" — this is an environment issue, not a code issue.
4. **Dashboard state is persisted to `localStorage`** under the key `dot-mbenoun-next-v5` (see `STORAGE_KEY` in `lib/dot-data.ts`). State is `{ checked, prices }` — the check-off map (seeded from each item's `status`; settled items start checked) and the real-price override map (seeded from each item's `real`). **Bump the key** if you change the seed and want existing users to pick up new defaults.

## Dot dashboard data model

`lib/dot-data.ts` is the single source of truth. Each `Item` has `id`, `art`, `qte`, `total` (estimated FCFA), `status` (`paid` | `pending` | `cash` — the real payment status), and an optional `real` (seed real price, FCFA). There is no separate `bought`/`cash` field: the initial check-off seed derives from `status !== "pending"`, and the interactive checkbox tracks acquisition thereafter. **Real prices are editable at runtime** via the per-row edit dialog (pencil icon) — `realOf(state, id)` reads the persisted `prices` override (seeded from `real`), so edit `ITEMS[].real` to change the *default*, or use the dialog to change the *live* value. `compute(state)` derives all KPIs (engaged, real spend, savings, remaining, pending total, per-status totals). To change the list, edit `ITEMS`; the UI and totals follow automatically.

**`PREDOT_EXPENSES`** (also in `lib/dot-data.ts`) is a separate, static ledger rendered by `predot.tsx` ("Pré-dot" — cash + whisky bought in ZAR + the Spar Bastos rum/sodas). It tracks spend outside the formal dot list and is **deliberately NOT folded into the dot KPIs**. The "Récapitulatif général" card in `dot-dashboard.tsx` sums `compute().realSum` + `predotTotal()` + `TRANSPORT_VILLAGE.amount` for the grand total (the transport is an estimate, broken out separately from the dépensé figure).
