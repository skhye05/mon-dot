"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  IconCalendarDollar,
  IconCircleCheckFilled,
  IconClock,
  IconMoon,
  IconPigMoney,
  IconReceipt2,
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
} from "@workspace/ui/components/card"
import { Donut, ChartLegend, CompareBars } from "@/components/dashboard/charts"
import { ItemsTable } from "@/components/dashboard/items-table"
import { PredotExpenses } from "@/components/dashboard/predot"
import {
  ITEMS,
  STATUS_META,
  STORAGE_KEY,
  compute,
  fmt,
  isChecked,
  predotTotal,
  realOf,
  seedState,
  type DotState,
} from "@/lib/dot-data"

const C_PAID = "#22c55e"
const C_CASH = "#f59e0b"
const C_PENDING = "#8b5cf6"
const C_ENGAGE = "#7c3aed"

export function DotDashboard() {
  const [state, setState] = React.useState<DotState>(seedState)
  const [ready, setReady] = React.useState(false)

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
  const predot = predotTotal()

  function toggle(id: number, value: boolean) {
    setState((s) => ({ ...s, checked: { ...s.checked, [id]: value } }))
  }
  function toggleAll(ids: number[], value: boolean) {
    setState((s) => {
      const checked = { ...s.checked }
      for (const id of ids) checked[id] = value
      return { ...s, checked }
    })
  }
  function setPrice(id: number, raw: string) {
    setState((s) => {
      const prices = { ...s.prices }
      const v = parseFloat(raw.replace(/\s/g, ""))
      if (raw.trim() === "" || Number.isNaN(v)) delete prices[id]
      else prices[id] = v
      return { ...s, prices }
    })
  }
  function reset() {
    if (confirm("Réinitialiser les achats cochés et les prix réels ?")) {
      setState(seedState())
    }
  }

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
      label: "En attente",
      value: fmt(c.pendingTotal),
      sub: "à régler",
      Icon: IconClock,
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
    { label: "Payé", value: c.byStatus.paid, color: C_PAID, Icon: STATUS_META.paid.Icon },
    { label: "Cash", value: c.byStatus.cash, color: C_CASH, Icon: STATUS_META.cash.Icon },
    { label: "En attente", value: c.byStatus.pending, color: C_PENDING, Icon: STATUS_META.pending.Icon },
  ]

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
              <p className="text-muted-foreground text-xs">Aucun prix réel.</p>
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
                : "Aucun prix réel"}
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
            <CardDescription>Cochez, filtrez, triez — éditez le prix réel par ligne</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemsTable
              state={state}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onSetPrice={setPrice}
            />
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

      <div className="mt-4">
        <PredotExpenses />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif général</CardTitle>
            <CardDescription>Tout cumulé — dot + pré-dot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-muted-foreground text-[0.6875rem] font-medium tracking-wide uppercase">
                  Total général dépensé
                </div>
                <div className="mt-0.5 text-3xl font-bold tracking-tight tabular-nums">
                  {fmt(c.realSum + predot)}
                </div>
                <div className="text-muted-foreground mt-1 text-[0.6875rem]">
                  dont {fmt(c.realSum)} dot + {fmt(predot)} pré-dot
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <RecapStat label="Dépense dot (réel)" value={fmt(c.realSum)} />
                <RecapStat label="Pré-dot" value={fmt(predot)} />
                <RecapStat label="Total dépensé" value={fmt(c.realSum + predot)} highlight />
                <RecapStat label="Budget dot (estimé)" value={fmt(c.totalEstime)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RecapStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        highlight && "border-foreground/20 bg-muted/50"
      )}
    >
      <div className="text-muted-foreground text-[0.625rem] font-medium tracking-wide uppercase">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold tracking-tight tabular-nums">
        {value}
      </div>
    </div>
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
          Cochez les achats au fur et à mesure — modifiez les prix réels via la fenêtre d&apos;édition. Suivi sauvegardé localement.
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
