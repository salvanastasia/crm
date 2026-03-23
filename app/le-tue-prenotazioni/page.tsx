import { Suspense } from "react"
import { LeTuePrenotazioniClient } from "./le-tue-prenotazioni-client"

export default function LeTuePrenotazioniPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Le Tue Prenotazioni</h1>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      }
    >
      <LeTuePrenotazioniClient />
    </Suspense>
  )
}
