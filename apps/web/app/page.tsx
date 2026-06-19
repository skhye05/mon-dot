import type { Metadata } from "next"

import { DotDashboard } from "@/components/dashboard/dot-dashboard"

export const metadata: Metadata = {
  title: "La Dot · Famille Mbenoun",
  description:
    "Tableau de bord des achats de la dot — suivi du budget et des prix réels.",
}

export default function Page() {
  return (
    <main className="min-h-svh">
      <DotDashboard />
    </main>
  )
}
