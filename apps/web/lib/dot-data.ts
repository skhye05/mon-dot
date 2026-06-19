import { IconCash, IconCircleCheck, IconClock } from "@tabler/icons-react"

/** Payment status of an item (the "real" status). */
export type Status = "paid" | "pending" | "cash"

export type Item = {
  id: number
  art: string
  qte: number | string
  total: number
  status: Status
  /** fixed real price paid (FCFA) — set once the item is settled, read-only in the UI */
  real?: number
}

/** Reference list — Famille Mbenoun, La Dot. Amounts in FCFA. */
export const ITEMS: Item[] = [
  { id: 1, art: "Porcs", qte: 3, total: 900000, status: "paid", real: 1000000 },
  { id: 2, art: "Mouton", qte: 1, total: 80000, status: "paid", real: 80000 },
  { id: 3, art: "Cartons de poisson (bar anglais)", qte: 4, total: 128000, status: "paid", real: 140000 },
  { id: 4, art: "Sacs de riz 50 kg (Lune d'Afrique + Habiba)", qte: 2, total: 40000, status: "paid", real: 46000 },
  { id: 5, art: "100 kg d'oignon + filet d'ail", qte: "—", total: 35000, status: "paid", real: 65000 },
  { id: 6, art: "Cartons d'huile raffinée", qte: 4, total: 86000, status: "paid", real: 85000 },
  { id: 7, art: "Tomate (boîte 3/5 + tomates fraîches)", qte: 5, total: 24000, status: "paid", real: 25600 },
  { id: 8, art: "Carton de cube", qte: 1, total: 21500, status: "paid", real: 22500 },
  { id: 9, art: "Enveloppe beau-père", qte: 1, total: 250000, status: "cash", real: 250000 },
  { id: 10, art: "Cartouches d'allumettes", qte: 2, total: 5000, status: "paid", real: 3000 },
  { id: 11, art: "Sacs de sel", qte: 2, total: 6000, status: "paid", real: 7000 },
  { id: 12, art: "Cartouches de cigarettes (LB bleu)", qte: 3, total: 13500, status: "paid", real: 12000 },
  { id: 13, art: "Enveloppe belle-mère", qte: 1, total: 300000, status: "cash", real: 300000 },
  { id: 14, art: "Pagnes « Super WAX » (belle-mère)", qte: 2, total: 40000, status: "paid", real: 45000 },
  { id: 26, art: "Pagnes « WAX » (2 × 9 000)", qte: 2, total: 18000, status: "paid", real: 18000 },
  { id: 15, art: "Palettes de vin rouge (Vinosol Tetra)", qte: 5, total: 117500, status: "paid", real: 76700 }, // 1 palette re-achetée plus chère (remplacement)
  { id: 16, art: "Casiers de bière", qte: 10, total: 90000, status: "pending" },
  { id: 17, art: "Casiers de jus (Brass — acheté à l'avance)", qte: 5, total: 12500, status: "paid", real: 14250 },
  { id: 18, art: "Bouteilles de whisky (JD, BL, J&B)", qte: 3, total: 120000, status: "paid", real: 120000 },
  { id: 19, art: "Enveloppe", qte: 1, total: 250000, status: "paid", real: 250000 },
  { id: 20, art: "Cocottes-minutes (8 et 10 L)", qte: 2, total: 72000, status: "pending" },
  { id: 21, art: "Marmites (alu + alubassa)", qte: 4, total: 150000, status: "paid", real: 87000 },
  { id: 22, art: "Marmites « TEFAL » (2 × Super Cook 9,4 L)", qte: 2, total: 63000, status: "pending" },
  { id: 23, art: "Four à micro-ondes", qte: 1, total: 150000, status: "cash", real: 150000 },
  { id: 24, art: "Machettes (coupe-coupe)", qte: 2, total: 3000, status: "paid", real: 3000 },
  { id: 25, art: "Limes (à affûter)", qte: 2, total: 1500, status: "paid", real: 1500 },
]

export const STATUS_META: Record<
  Status,
  { label: string; Icon: typeof IconCircleCheck; rank: number }
> = {
  paid: { label: "Payé", Icon: IconCircleCheck, rank: 0 },
  cash: { label: "Cash", Icon: IconCash, rank: 1 },
  pending: { label: "En attente", Icon: IconClock, rank: 2 },
}

/** Bumped to v4: Porcs/Mouton now settled (paid) + revised estimates for cocottes/Tefal. */
export const STORAGE_KEY = "dot-mbenoun-next-v4"

export type DotState = {
  checked: Record<number, boolean>
  /** real price overrides (FCFA), seeded from each item's `real`, edited via the Dialog */
  prices: Record<number, number>
}

export function seedState(): DotState {
  const checked: Record<number, boolean> = {}
  const prices: Record<number, number> = {}
  for (const i of ITEMS) {
    // settled items (paid/cash) start ticked off; pending items don't.
    checked[i.id] = i.status !== "pending"
    if (i.real != null) prices[i.id] = i.real
  }
  return { checked, prices }
}

export function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}

export function fmtShort(n: number): string {
  const a = Math.abs(n)
  if (a >= 1000) return new Intl.NumberFormat("fr-FR").format(Math.round(n / 1000)) + "k"
  return String(Math.round(n))
}

/** Real price for an item — the persisted override (seeded from the data, edited via the Dialog). */
export function realOf(state: DotState, id: number): number | null {
  const v = state.prices[id]
  return v == null ? null : v
}

export function isChecked(state: DotState, id: number): boolean {
  return !!state.checked[id]
}

export type Computed = {
  totalEstime: number
  byStatus: Record<Status, number>
  boughtEstime: number
  remaining: number
  realSum: number
  savings: number
  realBought: number
  estBought: number
  deltas: { item: Item; delta: number }[]
  countDone: number
  n: number
  pendingTotal: number
}

export function compute(state: DotState): Computed {
  const totalEstime = ITEMS.reduce((s, i) => s + i.total, 0)
  const byStatus: Record<Status, number> = { paid: 0, cash: 0, pending: 0 }
  for (const i of ITEMS) byStatus[i.status] += i.total

  const checkedItems = ITEMS.filter((i) => isChecked(state, i.id))
  const boughtEstime = checkedItems.reduce((s, i) => s + i.total, 0)
  const remaining = totalEstime - boughtEstime
  const realSum = ITEMS.reduce((s, i) => s + (realOf(state, i.id) ?? 0), 0)

  let savings = 0
  let realBought = 0
  let estBought = 0
  const deltas: { item: Item; delta: number }[] = []
  for (const i of checkedItems) {
    const r = realOf(state, i.id)
    if (r != null) {
      savings += i.total - r
      realBought += r
      estBought += i.total
      deltas.push({ item: i, delta: i.total - r })
    }
  }

  return {
    totalEstime,
    byStatus,
    boughtEstime,
    remaining,
    realSum,
    savings,
    realBought,
    estBought,
    deltas,
    countDone: checkedItems.length,
    n: ITEMS.length,
    pendingTotal: byStatus.pending,
  }
}

/** Expenses tracked outside the formal dot list (pre-dot ceremony, receipts). */
export type OtherExpense = {
  label: string
  detail?: string
  amount: number
  cash?: boolean
}

export type OtherExpenseGroup = {
  group: string
  note?: string
  items: OtherExpense[]
}

/**
 * Standalone ledger — NOT folded into the dot KPIs. The Santa Lucia receipt
 * (jus + vin) is the source document for dot items #15 and #17, so it's shown
 * here as a record, not as additional spend.
 */
export const OTHER_EXPENSES: OtherExpenseGroup[] = [
  {
    group: "Pré-dot",
    items: [{ label: "Pré-dot", detail: "espèces", amount: 150000, cash: true }],
  },
  {
    group: "Santa Lucia (Agence Mokolo)",
    note: "reçu — = articles #15 (vin) et #17 (jus) de la dot",
    items: [
      { label: "Jus Brass Top Orange 1L", detail: "1 palette de 6 × 2 850", amount: 2850 },
      { label: "Jus Brass Grenadine 1L", detail: "1 palette de 6 × 2 850", amount: 2850 },
      { label: "Jus Brass Pamplemousse 1L", detail: "1 palette de 6 × 2 850", amount: 2850 },
      { label: "Jus Brasserie Ananas 1L", detail: "1 palette de 6 × 2 850", amount: 2850 },
      { label: "Jus Brass Grenadine 1L", detail: "1 paquet de 3 × 1 425", amount: 1425 },
      { label: "Jus Brass Top Orange 1L", detail: "1 paquet de 3 × 1 425", amount: 1425 },
      { label: "Vin Vinosol Tetra Slim Brick 1L", detail: "5 palettes de 12 × 13 800", amount: 69000 },
    ],
  },
]

export function otherExpensesTotal(): number {
  return OTHER_EXPENSES.reduce(
    (s, g) => s + g.items.reduce((a, i) => a + i.amount, 0),
    0
  )
}
