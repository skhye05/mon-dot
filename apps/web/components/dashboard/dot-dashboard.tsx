"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  IconArrowsSort,
  IconCalendarDollar,
  IconCash,
  IconCircleCheckFilled,
  IconLayoutGrid,
  IconMoon,
  IconPigMoney,
  IconReceipt2,
  IconSearch,
  IconShoppingCart,
  IconSun,
  IconWallet,
} from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Donut, ChartLegend, CompareBars } from "@/components/dashboard/charts"
import {
  ITEMS,
  STATUS_META,
  STORAGE_KEY,
  compute,
  fmt,
  isChecked,
  realOf,
  seedState,
  type DotState,
  type Item,
  type Status,
} from "@/lib/dot-data"

const C_TODAY = "#f59e0b"
const C_JOURJ = "#8b5cf6"
const C_DONE = "#22c55e"
const C_ENGAGE = "#7c3aed"

const STATUS_BADGE: Record<Status, string> = {
  today:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  jourj:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  done:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
}

type Filter = "all" | "today" | "jourj" | "bought" | "todo"
type SortKey = "id" | "art" | "total" | "real" | "delta" | "status"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "today", label: "🛒 Aujourd'hui" },
  { key: "jourj", label: "⏳ Jour J" },
  { key: "bought", label: "✅ Achetés" },
  { key: "todo", label: "◻︎ Reste à acheter" },
]

export function DotDashboard() {
  const [state, setState] = React.useState<DotState>(seedState)
  const [ready, setReady] = React.useState(false)
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState<SortKey>("id")
  const [grouped, setGrouped] = React.useState(false)

  // load persisted state on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState(JSON.parse(raw) as DotState)
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  // persist
  React.useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state, ready])

  const c = React.useMemo(() => compute(state), [state])
  const pct = Math.round((c.boughtEstime / c.totalEstime) * 100)

  function toggle(id: number, value: boolean) {
    setState((s) => ({ ...s, checked: { ...s.checked, [id]: value } }))
  }
  function setPrice(id: number, value: string) {
    setState((s) => ({ ...s, prices: { ...s.prices, [id]: value } }))
  }
  function reset() {
    if (confirm("Réinitialiser tous les achats cochés et prix saisis ?")) {
      setState(seedState())
    }
  }

  const rows = React.useMemo(() => {
    let r = ITEMS.filter((i) => {
      if (filter === "bought") return isChecked(state, i.id)
      if (filter === "todo") return !isChecked(state, i.id)
      if (filter === "today" || filter === "jourj") return i.status === filter
      return true
    })
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter((i) => i.art.toLowerCase().includes(q))
    }
    const delta = (i: Item) => {
      const v = realOf(state, i.id)
      return v != null ? i.total - v : -Infinity
    }
    const cmp: Record<SortKey, (a: Item, b: Item) => number> = {
      id: (a, b) => a.id - b.id,
      art: (a, b) => a.art.localeCompare(b.art, "fr"),
      total: (a, b) => b.total - a.total,
      real: (a, b) => (realOf(state, b.id) ?? 0) - (realOf(state, a.id) ?? 0),
      delta: (a, b) => delta(b) - delta(a),
      status: (a, b) =>
        STATUS_META[a.status].rank - STATUS_META[b.status].rank || a.id - b.id,
    }
    return [...r].sort(cmp[sortBy])
  }, [state, filter, query, sortBy])

  const compareRows = React.useMemo(() => {
    return ITEMS.filter((i) => isChecked(state, i.id) && realOf(state, i.id) != null)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map((i) => ({
        label: i.art.split(" (")[0] ?? i.art,
        est: i.total,
        real: realOf(state, i.id) ?? 0,
      }))
  }, [state])
  const compareMax = Math.max(1, ...compareRows.flatMap((r) => [r.est, r.real]))

  const sortedDeltas = React.useMemo(
    () => [...c.deltas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 7),
    [c.deltas]
  )
  const deltaMax = Math.max(1, ...sortedDeltas.map((d) => Math.abs(d.delta)))

  const kpis = [
    {
      label: "Budget total",
      value: fmt(c.totalEstime),
      sub: `${c.n} articles`,
      Icon: IconWallet,
      tint: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    },
    {
      label: "Engagé",
      value: fmt(c.boughtEstime),
      sub: `${c.countDone} / ${c.n} · ${pct}%`,
      Icon: IconCircleCheckFilled,
      tint: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    },
    {
      label: "Dépense réelle",
      value: fmt(c.realSum),
      sub: "cash sorti",
      Icon: IconReceipt2,
      tint: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
    },
    {
      label: "Économies",
      value: `${c.savings >= 0 ? "+" : ""}${fmt(c.savings)}`,
      sub: c.savings >= 0 ? "vs estimé" : "dépassement",
      Icon: IconPigMoney,
      tint:
        c.savings >= 0
          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
      valueClass: c.savings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Reste aujourd'hui",
      value: fmt(c.todoToday),
      sub: "non-périssables",
      Icon: IconShoppingCart,
      tint: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    },
    {
      label: "Reste à dépenser",
      value: fmt(c.remaining),
      sub: "estimé restant",
      Icon: IconCalendarDollar,
      tint: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    },
  ]

  const statusSegments = [
    { label: "🛒 Aujourd'hui", value: c.byStatus.today, color: C_TODAY },
    { label: "⏳ Jour J", value: c.byStatus.jourj, color: C_JOURJ },
    { label: "✅ Déjà acheté", value: c.byStatus.done, color: C_DONE },
  ]

  const grandSub = rows.reduce((s, i) => s + i.total, 0)
  const grandReal = rows.reduce((s, i) => s + (realOf(state, i.id) ?? 0), 0)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Header />

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="gap-2 py-4">
            <CardContent className="px-4">
              <div className={cn("mb-2.5 flex size-8 items-center justify-center rounded-lg", k.tint)}>
                <k.Icon className="size-4" stroke={2} />
              </div>
              <div className="text-muted-foreground text-[0.6875rem] font-medium tracking-wide uppercase">
                {k.label}
              </div>
              <div className={cn("mt-0.5 text-lg font-bold tracking-tight tabular-nums", k.valueClass)}>
                {k.value}
              </div>
              <div className="text-muted-foreground mt-1 text-[0.6875rem]">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Avancement du budget</CardTitle>
            <CardDescription>Valeur estimée des articles cochés</CardDescription>
          </CardHeader>
          <CardContent>
            <Donut
              segments={[{ label: "Engagé", value: c.boughtEstime, color: C_ENGAGE }]}
              centerTop={<span className="text-2xl font-bold tracking-tight tabular-nums">{pct}%</span>}
              centerBottom={<span className="text-muted-foreground text-[0.6875rem]">engagé</span>}
            />
            <div className="text-muted-foreground mt-3 text-center text-[0.6875rem]">
              {fmt(c.boughtEstime)} / {fmt(c.totalEstime)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimé vs Réel</CardTitle>
            <CardDescription>Plus gros achats — écart de prix</CardDescription>
          </CardHeader>
          <CardContent>
            {compareRows.length ? (
              <CompareBars rows={compareRows} max={compareMax} />
            ) : (
              <p className="text-muted-foreground text-xs">Aucun prix réel saisi.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
            <CardDescription>Part du budget total estimé</CardDescription>
          </CardHeader>
          <CardContent>
            <Donut segments={statusSegments} thickness={20} />
            <ChartLegend segments={statusSegments} />
          </CardContent>
        </Card>
      </div>

      {/* Savings + table */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Économies réalisées</CardTitle>
            <CardDescription>Prix réel vs estimé sur les achats</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-3xl font-bold tracking-tight tabular-nums",
                c.savings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {c.savings >= 0 ? "+" : ""}
              {fmt(c.savings)}
            </div>
            <div className="text-muted-foreground mt-1 mb-4 text-[0.6875rem]">
              {c.deltas.length
                ? `sur ${c.deltas.length} articles · réel ${fmt(c.realBought)}`
                : "Aucun prix réel saisi"}
            </div>
            <div className="flex flex-col gap-2.5">
              {sortedDeltas.map(({ item, delta }) => {
                const pos = delta >= 0
                return (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">{item.art.split(" (")[0]}</span>
                    <span className="bg-muted/60 h-1.5 w-16 overflow-hidden rounded-full">
                      <span
                        className={cn("block h-full rounded-full", pos ? "bg-emerald-500" : "bg-rose-500")}
                        style={{ width: `${(Math.abs(delta) / deltaMax) * 100}%` }}
                      />
                    </span>
                    <span
                      className={cn(
                        "tabular-nums font-semibold",
                        pos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {pos ? "−" : "+"}
                      {fmt(Math.abs(delta))}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Articles</CardTitle>
            <CardDescription>{rows.length} articles affichés</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Toolbar */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px] flex-1">
                <IconSearch className="text-muted-foreground absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un article…"
                  className="pl-7"
                />
              </div>
              <div className="relative">
                <IconArrowsSort className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-7 rounded-md border pr-2 pl-7 text-xs outline-none focus-visible:ring-2"
                >
                  <option value="id">Ordre</option>
                  <option value="art">Nom (A→Z)</option>
                  <option value="total">Budget ↓</option>
                  <option value="real">Prix réel ↓</option>
                  <option value="delta">Écart ↓</option>
                  <option value="status">Statut</option>
                </select>
              </div>
              <Button
                variant={grouped ? "secondary" : "outline"}
                size="sm"
                onClick={() => setGrouped((g) => !g)}
              >
                <IconLayoutGrid /> Grouper
              </Button>
            </div>

            {/* Filter pills */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">Estimé</TableHead>
                    <TableHead className="text-right">Prix réel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped
                    ? (["today", "jourj", "done"] as Status[]).flatMap((st) => {
                        const g = rows.filter((i) => i.status === st)
                        if (!g.length) return []
                        const sub = g.reduce((s, i) => s + i.total, 0)
                        return [
                          <TableRow key={`h-${st}`} className="bg-muted/40 hover:bg-muted/40">
                            <TableCell colSpan={5} className="text-muted-foreground text-[0.6875rem] font-semibold tracking-wide uppercase">
                              {STATUS_META[st].short} {STATUS_META[st].label} · {g.length}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">{fmt(sub)}</TableCell>
                            <TableCell />
                          </TableRow>,
                          ...g.map((i) => (
                            <ItemRow
                              key={i.id}
                              item={i}
                              checked={isChecked(state, i.id)}
                              price={state.prices[i.id] ?? ""}
                              onToggle={toggle}
                              onPrice={setPrice}
                            />
                          )),
                        ]
                      })
                    : rows.map((i) => (
                        <ItemRow
                          key={i.id}
                          item={i}
                          checked={isChecked(state, i.id)}
                          price={state.prices[i.id] ?? ""}
                          onToggle={toggle}
                          onPrice={setPrice}
                        />
                      ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="font-semibold">
                      TOTAL {filter === "all" && !query ? "général" : "(filtré)"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-bold">{fmt(grandSub)}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold">
                      {grandReal > 0 ? fmt(grandReal) : "—"}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-muted-foreground flex gap-3 text-[0.6875rem]">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" /> sous budget
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500" /> dépassement
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                ↺ Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ItemRow({
  item,
  checked,
  price,
  onToggle,
  onPrice,
}: {
  item: Item
  checked: boolean
  price: string
  onToggle: (id: number, v: boolean) => void
  onPrice: (id: number, v: string) => void
}) {
  const raw = price.replace(/\s/g, "")
  const real = raw === "" ? null : Number(raw)
  const hasReal = real != null && !Number.isNaN(real)
  const over = hasReal && real > item.total
  const under = hasReal && real < item.total
  const meta = STATUS_META[item.status]

  return (
    <TableRow className={cn(checked && "text-muted-foreground")}>
      <TableCell>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(item.id, e.target.checked)}
          className="accent-primary size-4 cursor-pointer rounded"
          aria-label={`Marquer ${item.art}`}
        />
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{item.id}</TableCell>
      <TableCell>
        <span className={cn("font-medium", checked && "line-through")}>
          {item.art.split(" (")[0]}
        </span>
        {item.cash && (
          <Badge variant="muted" className="ml-1.5 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <IconCash className="size-3" /> Cash
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge className={cn("font-medium", STATUS_BADGE[item.status])}>
          {meta.short} {meta.label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-center tabular-nums">{item.qte}</TableCell>
      <TableCell className="text-right tabular-nums font-medium">{fmt(item.total)}</TableCell>
      <TableCell className="text-right">
        <Input
          inputMode="numeric"
          value={price}
          onChange={(e) => onPrice(item.id, e.target.value)}
          placeholder="prix réel…"
          className={cn(
            "ml-auto h-7 w-28 text-right tabular-nums",
            over && "border-rose-400 bg-rose-50 dark:bg-rose-500/10",
            under && "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
          )}
        />
        {hasReal && (
          <div
            className={cn(
              "mt-1 text-[0.625rem] font-semibold tabular-nums",
              over ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {over
              ? `▲ +${fmt(real - item.total)}`
              : under
                ? `▼ −${fmt(item.total - real)}`
                : "✓ identique"}
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-muted-foreground text-[0.6875rem] font-semibold tracking-[0.2em] uppercase">
          Famille Mbenoun · La Dot
        </p>
        <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight">
          Tableau de bord des achats
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Cochez les achats et saisissez les prix réels — tout est sauvegardé localement.
        </p>
      </div>
      <Button
        variant="outline"
        size="icon"
        aria-label="Basculer le thème"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {mounted && resolvedTheme === "dark" ? <IconSun /> : <IconMoon />}
      </Button>
    </div>
  )
}
