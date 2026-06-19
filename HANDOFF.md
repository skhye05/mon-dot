# Handoff — La Dot · Famille Mbenoun dashboard

Last updated: 2026-06-19. This document lets another session (e.g. Claude Code) pick up the work without losing context. For repo conventions see `CLAUDE.md`.

## 1. Context

A tool to plan and track the purchases for the **dot (dowry) of the Mbenoun family**. It started as a single reference list (built from handwritten lists, a PDF, and shopping receipts) and was migrated into this Next.js + shadcn app. The user shops over several days, ticks items off, and records the **real price paid** against the **estimated budget**, all in **FCFA**.

## 2. What exists now (in this repo)

A working dashboard at `apps/web` (committed in `470f7a8`):

- `lib/dot-data.ts` — **single source of truth.** 26 typed items + `compute()` (KPIs), `fmt()`, and `seedState()` (localStorage seed). Edit `ITEMS` to change the list; UI + totals follow.
- `components/dashboard/dot-dashboard.tsx` — client orchestrator: KPI cards, budget gauge, status donut, savings panel, and the items table (search, sort, group-by-status, check-off, live price entry). Persists to `localStorage` key `dot-mbenoun-next-v1`.
- `components/dashboard/charts.tsx` — dependency-free SVG donut/gauge + comparison bars (no chart library).
- `components/ui/{card,badge,input,table,progress}.tsx` — hand-built shadcn primitives in the radix-mira style.
- `app/page.tsx` — renders `<DotDashboard/>` with page metadata.

**Verification done:** `pnpm typecheck` passes; `pnpm lint` reports only minor warnings (no errors). A full `next build` was **not** run in the build environment because the Linux SWC binary wasn't available there — it builds on macOS where `@next/swc-darwin-arm64` is installed. **Next step for whoever continues: run `pnpm dev` / `pnpm build` locally to confirm the render.**

## 3. Current numbers (from the seeded data)

| Metric | Value (FCFA) |
|---|---|
| Budget total estimé | 2 970 500 |
| Engagé (acheté) | 1 771 500 (21 / 26 items) |
| Dépense réelle (cash sorti) | 1 713 850 |
| Économies réalisées | +57 650 |
| Reste à acheter aujourd'hui | 29 000 |
| Reste à dépenser (estimé) | 1 199 000 |

**Still not bought (item ids):** 1 Porcs, 2 Mouton, 16 Casiers de bière, 20 Cocottes-minutes, 22 Marmites « TEFAL » (all Jour J perishables except cocottes/TEFAL).

## 4. Status model

- `today` 🛒 — non-perishables that can be bought ahead.
- `jourj` ⏳ — perishables + envelopes, paid on the wedding day (Jour J).
- `done` ✅ — already acquired.
- `cash` flag — paid in cash (envelopes beau-père/belle-mère, microwave).

## 5. Decisions log (so they aren't re-litigated)

- **Whisky** (JD/Black Label/J&B) already bought for 120 000 — do not recount.
- **Marmites alu + alubassa** = 87 000 real (32 000 + 27 500 + 27 500); the **TEFAL** marmites were NOT bought.
- **Tomatoes** = 25 600 (3/5 canned cartons 14 100 + fresh tomatoes 11 500).
- **Onions** line includes a "filet d'ail" (garlic net) → 65 000.
- **Cash items** (2 envelopes + microwave) had their real price set equal to the cash amount.
- **Pagnes:** Super WAX for the belle-mère 45 000, plus a separate WAX pair (2 × 9 000 = 18 000).
- **New tools added:** machettes (coupe-coupe) 3 000, sharpening files (limes) 1 500.
- Two interpretations flagged for confirmation: "filet aie" → garlic net; "limes" → sharpening files (could be lime fruit).

## 6. Related artifacts (outside this repo)

Earlier deliverables live in the user's "My Wife and I" folder and are **one or more edits behind** the current data:

- `dashboard-dot-mbenoun.html` — standalone offline version (localStorage, same logic). This was the working reference before the migration.
- `dot-mbenoun.xlsx` — Résumé + Liste sheets with live formulas.
- `dot-mbenoun.pdf` — printable report.

If these need to stay in sync, regenerate them from the current `ITEMS` in `lib/dot-data.ts`.

## 7. Suggested next steps

1. Run `pnpm dev` locally and visually QA (light + dark, mobile width).
2. Extract the status pill into a shared `<StatusBadge>` (consider moving to `packages/ui`).
3. Decide whether to add a real chart lib (recharts) or keep the SVG charts.
4. If you want official radix-mira components, obtain shadcn registry auth, then `pnpm dlx shadcn add <name> -c apps/web`.
5. Sync the HTML/Excel/PDF exports if they're still in use.
6. Optional: add a small unit test around `compute()` to lock the budget math.
