"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type Segment = { label: string; value: number; color: string }

function polar(cx: number, cy: number, r: number, angle: number) {
  const a = (angle - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number
) {
  const s = polar(cx, cy, r, end)
  const e = polar(cx, cy, r, start)
  const large = end - start <= 180 ? 0 : 1
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`
}

/** Donut built from stroked arcs — no external chart lib. */
export function Donut({
  segments,
  size = 168,
  thickness = 16,
  centerTop,
  centerBottom,
}: {
  segments: Segment[]
  size?: number
  thickness?: number
  centerTop?: React.ReactNode
  centerBottom?: React.ReactNode
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  // prefix sums so we don't mutate during render
  const offsets: number[] = []
  segments.reduce((acc, seg) => {
    offsets.push(acc)
    return acc + seg.value
  }, 0)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="stroke-muted"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => {
          const frac = seg.value / total
          if (frac <= 0) return null
          const start = ((offsets[i] ?? 0) / total) * 360
          const end = start + frac * 360
          return (
            <path
              key={i}
              d={arcPath(cx, cy, r, start, Math.min(end, start + 359.999))}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      {(centerTop || centerBottom) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerTop}
          {centerBottom}
        </div>
      )}
    </div>
  )
}

export function ChartLegend({ segments }: { segments: Segment[] }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {segments.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[0.6875rem]">
          <span
            className="size-2 rounded-full"
            style={{ background: s.color }}
          />
          <span className="text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Horizontal comparison bars (estimé vs réel) in pure markup. */
export function CompareBars({
  rows,
  max,
}: {
  rows: { label: string; est: number; real: number }[]
  max: number
}) {
  const scale = (v: number) => `${Math.max(2, (v / (max || 1)) * 100)}%`
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="text-muted-foreground flex items-center justify-between text-[0.6875rem]">
            <span className="truncate">{row.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-muted/60 h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-chart-2 h-full rounded-full"
                style={{ width: scale(row.est) }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-muted/60 h-2 flex-1 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full",
                  row.real <= row.est ? "bg-emerald-500" : "bg-rose-500"
                )}
                style={{ width: scale(row.real) }}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="text-muted-foreground mt-1 flex gap-4 text-[0.625rem]">
        <span className="flex items-center gap-1.5">
          <span className="bg-chart-2 size-2 rounded-full" /> Estimé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-emerald-500 size-2 rounded-full" /> Réel
        </span>
      </div>
    </div>
  )
}
