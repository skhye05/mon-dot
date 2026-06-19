import * as React from "react"
import { IconCash } from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { OTHER_EXPENSES, fmt, otherExpensesTotal } from "@/lib/dot-data"

export function OtherExpenses() {
  const total = otherExpensesTotal()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autres dépenses</CardTitle>
        <CardDescription>
          Hors liste de la dot — comptabilisé séparément du budget
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Désignation</TableHead>
                <TableHead>Détail</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {OTHER_EXPENSES.map((g) => {
                const sub = g.items.reduce((a, i) => a + i.amount, 0)
                return (
                  <React.Fragment key={g.group}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell
                        colSpan={2}
                        className="text-muted-foreground text-[0.6875rem] font-semibold tracking-wide uppercase"
                      >
                        {g.group}
                        {g.note && (
                          <span className="text-muted-foreground/80 ml-1 normal-case">
                            · {g.note}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {fmt(sub)}
                      </TableCell>
                    </TableRow>
                    {g.items.map((it, idx) => (
                      <TableRow key={`${g.group}-${idx}`}>
                        <TableCell className="font-medium">
                          {it.label}
                          {it.cash && (
                            <Badge className="ml-1.5 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                              <IconCash /> Cash
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{it.detail}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(it.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">
                  TOTAL autres dépenses
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold">{fmt(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
