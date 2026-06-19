"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconPencil,
  IconSearch,
  IconSquare,
  IconSquareCheck,
} from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  ITEMS,
  STATUS_META,
  fmt,
  isChecked,
  realOf,
  type DotState,
  type Item,
  type Status,
} from "@/lib/dot-data"

const STATUS_BADGE: Record<Status, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  cash: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  pending: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
}

type Filter = "all" | "paid" | "cash" | "pending" | "bought" | "todo"

const FILTERS: { key: Filter; label: string; Icon?: typeof IconSquare }[] = [
  { key: "all", label: "Tous" },
  { key: "paid", label: "Payé", Icon: STATUS_META.paid.Icon },
  { key: "cash", label: "Cash", Icon: STATUS_META.cash.Icon },
  { key: "pending", label: "En attente", Icon: STATUS_META.pending.Icon },
  { key: "bought", label: "Acquis", Icon: IconSquareCheck },
  { key: "todo", label: "À acquérir", Icon: IconSquare },
]

const RIGHT = new Set(["total", "real"])

/** Row data enriched with the live (persisted) real price + checked flag. */
type Row = Item & { _real: number | null; _checked: boolean }

type TableMeta = {
  toggle: (id: number, value: boolean) => void
  toggleAll: (ids: number[], value: boolean) => void
  edit: (item: Item) => void
}

function SortHeader({
  column,
  children,
  align,
}: {
  column: Column<Row, unknown>
  children: React.ReactNode
  align?: "right"
}) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-mx-2 font-medium", align === "right" && "ml-auto")}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      {sorted === "asc" ? (
        <IconArrowUp />
      ) : sorted === "desc" ? (
        <IconArrowDown />
      ) : (
        <IconArrowsSort className="opacity-50" />
      )}
    </Button>
  )
}

const columns: ColumnDef<Row>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const meta = table.options.meta as TableMeta
      const rows = table.getRowModel().rows
      const all = rows.length > 0 && rows.every((r) => r.original._checked)
      const some = rows.some((r) => r.original._checked)
      return (
        <Checkbox
          checked={all ? true : some ? "indeterminate" : false}
          onCheckedChange={(v) =>
            meta.toggleAll(
              rows.map((r) => r.original.id),
              v === true
            )
          }
          aria-label="Tout cocher"
        />
      )
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta
      return (
        <Checkbox
          checked={row.original._checked}
          onCheckedChange={(v) => meta.toggle(row.original.id, v === true)}
          aria-label={`Marquer ${row.original.art}`}
        />
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => <SortHeader column={column}>#</SortHeader>,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{row.original.id}</span>
    ),
  },
  {
    accessorKey: "art",
    header: ({ column }) => <SortHeader column={column}>Article</SortHeader>,
    cell: ({ row }) => (
      <span className={cn("font-medium", row.original._checked && "line-through")}>
        {row.original.art.split(" (")[0]}
      </span>
    ),
    sortingFn: (a, b) => a.original.art.localeCompare(b.original.art, "fr"),
  },
  {
    id: "status",
    accessorFn: (row) => STATUS_META[row.status].rank,
    header: ({ column }) => <SortHeader column={column}>Statut</SortHeader>,
    cell: ({ row }) => {
      const meta = STATUS_META[row.original.status]
      return (
        <Badge className={cn("font-medium", STATUS_BADGE[row.original.status])}>
          <meta.Icon /> {meta.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "qte",
    header: () => <div className="text-center">Qté</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-center tabular-nums">
        {row.original.qte}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <SortHeader column={column} align="right">
        Estimé
      </SortHeader>
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums font-medium">{fmt(row.original.total)}</div>
    ),
  },
  {
    id: "real",
    accessorFn: (row) => row._real ?? -1,
    header: ({ column }) => (
      <SortHeader column={column} align="right">
        Prix réel
      </SortHeader>
    ),
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta
      const item = row.original
      const real = item._real
      const over = real != null && real > item.total
      const under = real != null && real < item.total
      return (
        <div className="flex items-center justify-end gap-1">
          <div className="text-right">
            {real != null ? (
              <>
                <div className="tabular-nums font-semibold">{fmt(real)}</div>
                <div
                  className={cn(
                    "text-[0.625rem] font-semibold tabular-nums",
                    over
                      ? "text-rose-600 dark:text-rose-400"
                      : under
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                  )}
                >
                  {over
                    ? `▲ +${fmt(real - item.total)}`
                    : under
                      ? `▼ −${fmt(item.total - real)}`
                      : "✓ identique"}
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Modifier le prix réel de ${item.art}`}
            onClick={() => meta.edit(item)}
          >
            <IconPencil />
          </Button>
        </div>
      )
    },
  },
]

export function ItemsTable({
  state,
  onToggle,
  onToggleAll,
  onSetPrice,
}: {
  state: DotState
  onToggle: (id: number, value: boolean) => void
  onToggleAll: (ids: number[], value: boolean) => void
  onSetPrice: (id: number, raw: string) => void
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [editItem, setEditItem] = React.useState<Item | null>(null)
  const [draft, setDraft] = React.useState("")

  const data = React.useMemo<Row[]>(() => {
    return ITEMS.filter((i) => {
      if (filter === "bought") return isChecked(state, i.id)
      if (filter === "todo") return !isChecked(state, i.id)
      if (filter === "paid" || filter === "cash" || filter === "pending")
        return i.status === filter
      return true
    }).map((i) => ({
      ...i,
      _real: realOf(state, i.id),
      _checked: isChecked(state, i.id),
    }))
  }, [filter, state])

  const table = useReactTable<Row>({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value) =>
      row.original.art.toLowerCase().includes(String(value).toLowerCase()),
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      toggle: onToggle,
      toggleAll: onToggleAll,
      edit: (item: Item) => {
        setEditItem(item)
        setDraft(String(realOf(state, item.id) ?? ""))
      },
    } satisfies TableMeta,
  })

  const fRows = table.getFilteredRowModel().rows
  const grandSub = fRows.reduce((s, r) => s + r.original.total, 0)
  const grandReal = fRows.reduce((s, r) => s + (r.original._real ?? 0), 0)

  const draftNum = (() => {
    const v = parseFloat(draft.replace(/\s/g, ""))
    return Number.isNaN(v) ? null : v
  })()

  function save() {
    if (!editItem) return
    onSetPrice(editItem.id, draft)
    setEditItem(null)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <IconSearch className="text-muted-foreground absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Rechercher un article…"
            className="pl-7"
          />
        </div>
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
            {f.Icon && <f.Icon />}
            {f.label}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.id === "select" && "w-8",
                      header.column.id === "id" && "w-12",
                      header.column.id === "qte" && "text-center",
                      RIGHT.has(header.column.id) && "text-right"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(row.original._checked && "text-muted-foreground")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-20 text-center"
                >
                  Aucun article.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="font-semibold">
                TOTAL {filter === "all" && !globalFilter ? "général" : "(filtré)"}
              </TableCell>
              <TableCell className="text-right tabular-nums font-bold">
                {fmt(grandSub)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-bold">
                {grandReal > 0 ? fmt(grandReal) : "—"}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Edit prix réel */}
      <Dialog
        open={editItem != null}
        onOpenChange={(open) => {
          if (!open) setEditItem(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le prix réel</DialogTitle>
            <DialogDescription>{editItem?.art}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="real-price">Montant payé (FCFA)</Label>
            <Input
              id="real-price"
              inputMode="numeric"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save()
              }}
              placeholder="laisser vide pour effacer"
              className="h-8"
            />
            {editItem && (
              <p className="text-muted-foreground text-[0.6875rem]">
                Budget estimé : {fmt(editItem.total)}
                {draftNum != null && (
                  <span
                    className={cn(
                      "ml-1 font-semibold",
                      draftNum > editItem.total
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    · {draftNum > editItem.total ? "+" : "−"}
                    {fmt(Math.abs(editItem.total - draftNum))}
                  </span>
                )}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>
              Annuler
            </Button>
            <Button onClick={save}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
