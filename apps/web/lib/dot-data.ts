export type Status = "today" | "jourj" | "done"

export type Item = {
  id: number
  art: string
  qte: number | string
  total: number
  status: Status
  bought?: boolean
  cash?: boolean
  /** seeded real price (FCFA) */
  real?: number
}

/** Reference list — Famille Mbenoun, La Dot. Amounts in FCFA. */
export const ITEMS: Item[] = [
  { id: 1, art: "Porcs", qte: 3, total: 1000000, status: "jourj" },
  { id: 2, art: "Mouton", qte: 1, total: 80000, status: "jourj" },
  { id: 3, art: "Cartons de poisson (bar anglais)", qte: 4, total: 128000, status: "jourj", bought: true, real: 140000 },
  { id: 4, art: "Sacs de riz 50 kg (Lune d'Afrique + Habiba)", qte: 2, total: 40000, status: "today", bought: true, real: 46000 },
  { id: 5, art: "100 kg d'oignon + filet d'ail", qte: "—", total: 35000, status: "jourj", bought: true, real: 65000 },
  { id: 6, art: "Cartons d'huile raffinée", qte: 4, total: 86000, status: "today", bought: true, real: 85000 },
  { id: 7, art: "Tomate (boîte 3/5 + tomates fraîches)", qte: 5, total: 24000, status: "today", bought: true, real: 25600 },
  { id: 8, art: "Carton de cube", qte: 1, total: 21500, status: "today", bought: true, real: 22500 },
  { id: 9, art: "Enveloppe beau-père", qte: 1, total: 250000, status: "jourj", cash: true, bought: true, real: 250000 },
  { id: 10, art: "Cartouches d'allumettes", qte: 2, total: 5000, status: "today", bought: true, real: 3000 },
  { id: 11, art: "Sacs de sel", qte: 2, total: 6000, status: "today", bought: true, real: 7000 },
  { id: 12, art: "Cartouches de cigarettes (LB bleu)", qte: 3, total: 13500, status: "today", bought: true, real: 12000 },
  { id: 13, art: "Enveloppe belle-mère", qte: 1, total: 300000, status: "jourj", cash: true, bought: true, real: 300000 },
  { id: 14, art: "Pagnes « Super WAX » (belle-mère)", qte: 2, total: 40000, status: "today", bought: true, real: 45000 },
  { id: 26, art: "Pagnes « WAX » (2 × 9 000)", qte: 2, total: 18000, status: "today", bought: true, real: 18000 },
  { id: 15, art: "Palettes de vin rouge (Vinosol Tetra)", qte: 5, total: 117500, status: "today", bought: true, real: 69000 },
  { id: 16, art: "Casiers de bière", qte: 10, total: 90000, status: "jourj" },
  { id: 17, art: "Casiers de jus (Brass — acheté à l'avance)", qte: 5, total: 12500, status: "jourj", bought: true, real: 14250 },
  { id: 18, art: "Bouteilles de whisky (JD, BL, J&B)", qte: 3, total: 120000, status: "done", real: 120000 },
  { id: 19, art: "Enveloppe", qte: 1, total: 250000, status: "jourj", bought: true, real: 250000 },
  { id: 20, art: "Cocottes-minutes (8 et 10 L)", qte: 2, total: 24000, status: "today" },
  { id: 21, art: "Marmites (alu + alubassa)", qte: 4, total: 150000, status: "today", bought: true, real: 87000 },
  { id: 22, art: "Marmites « TEFAL »", qte: 2, total: 5000, status: "today" },
  { id: 23, art: "Four à micro-ondes", qte: 1, total: 150000, status: "today", cash: true, bought: true, real: 150000 },
  { id: 24, art: "Machettes (coupe-coupe)", qte: 2, total: 3000, status: "today", bought: true, real: 3000 },
  { id: 25, art: "Limes (à affûter)", qte: 2, total: 1500, status: "today", bought: true, real: 1500 },
]

export const STATUS_META: Record<
  Status,
  { label: string; short: string; rank: number }
> = {
  today: { label: "Aujourd'hui", short: "🛒", rank: 0 },
  jourj: { label: "Jour J", short: "⏳", rank: 1 },
  done: { label: "Déjà acheté", short: "✅", rank: 2 },
}

export const STORAGE_KEY = "dot-mbenoun-next-v1"

export type DotState = {
  checked: Record<number, boolean>
  prices: Record<number, string>
}

export function seedState(): DotState {
  const checked: Record<number, boolean> = {}
  const prices: Record<number, string> = {}
  for (const i of ITEMS) {
    checked[i.id] = !!i.bought || i.status === "done"
    if (i.real != null) prices[i.id] = String(i.real)
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

export function realOf(state: DotState, id: number): number | null {
  const raw = (state.prices[id] ?? "").toString().replace(/\s/g, "")
  if (raw === "") return null
  const v = parseFloat(raw)
  return Number.isNaN(v) ? null : v
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
  todoToday: number
}

export function compute(state: DotState): Computed {
  const totalEstime = ITEMS.reduce((s, i) => s + i.total, 0)
  const byStatus: Record<Status, number> = { today: 0, jourj: 0, done: 0 }
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

  const todoToday = ITEMS.filter(
    (i) => i.status === "today" && !isChecked(state, i.id)
  ).reduce((s, i) => s + i.total, 0)

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
    todoToday,
  }
}
