"use client"

import * as React from "react"
import { Bar, BarChart, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"

export const C_PAID = "#22c55e"
export const C_CASH = "#f59e0b"
export const C_PENDING = "#8b5cf6"
export const C_ENGAGE = "#7c3aed"

export type StatusDatum = {
  key: string
  label: string
  value: number
  fill: string
}

/** Budget progress — donut with the engaged % in the center. */
export function BudgetDonut({
  engaged,
  total,
  pct,
}: {
  engaged: number
  total: number
  pct: number
}) {
  const data = [
    { key: "engaged", value: engaged, fill: C_ENGAGE },
    { key: "remaining", value: Math.max(0, total - engaged), fill: "var(--muted)" },
  ]
  const config = {
    value: { label: "FCFA" },
    engaged: { label: "Engagé", color: C_ENGAGE },
    remaining: { label: "Reste", color: "var(--muted)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[180px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={58}
          outerRadius={82}
          strokeWidth={2}
          startAngle={90}
          endAngle={-270}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && viewBox.cx != null && viewBox.cy != null) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold tabular-nums">
                      {pct}%
                    </tspan>
                    <tspan x={viewBox.cx} y={Number(viewBox.cy) + 18} className="fill-muted-foreground text-[0.6875rem]">
                      engagé
                    </tspan>
                  </text>
                )
              }
              return null
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

/** Budget breakdown by payment status — donut + legend. */
export function StatusDonut({ data }: { data: StatusDatum[] }) {
  const config: ChartConfig = { value: { label: "FCFA" } }
  data.forEach((d) => {
    config[d.key] = { label: d.label, color: d.fill }
  })

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[200px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius={50} outerRadius={80} strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="key" />}
          className="-translate-y-1 flex-wrap gap-x-4 gap-y-1"
        />
      </PieChart>
    </ChartContainer>
  )
}

/** Estimé vs Réel — grouped horizontal bars for the biggest purchases. */
export function CompareChart({
  rows,
}: {
  rows: { label: string; est: number; real: number }[]
}) {
  const config = {
    est: { label: "Estimé", color: "var(--chart-2)" },
    real: { label: "Réel", color: C_PAID },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
      <BarChart
        accessibilityLayer
        data={rows}
        layout="vertical"
        margin={{ left: 4, right: 8, top: 4, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={96}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
          tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 13) + "…" : v)}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="est" fill="var(--color-est)" radius={3} barSize={7} />
        <Bar dataKey="real" fill="var(--color-real)" radius={3} barSize={7} />
      </BarChart>
    </ChartContainer>
  )
}
