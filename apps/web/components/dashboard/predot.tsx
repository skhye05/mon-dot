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
import { PREDOT_EXPENSES, fmt, predotTotal } from "@/lib/dot-data"

export function PredotExpenses() {
  const total = predotTotal()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pré-dot</CardTitle>
        <CardDescription>Dépenses du pré-dot — hors liste de la dot</CardDescription>
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
              {PREDOT_EXPENSES.map((it, idx) => (
                <TableRow key={idx}>
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
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">
                  TOTAL pré-dot
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold">{fmt(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <p className="text-muted-foreground mt-2 text-[0.625rem]">
          Whisky converti à ≈ 34,5 FCFA / ZAR (juin 2026).
        </p>
      </CardContent>
    </Card>
  )
}
