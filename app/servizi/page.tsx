import { PlusCircle } from "lucide-react"
import { ServiceList } from "@/components/service-list"
import { AddServiceButton } from "@/components/add-service-button"

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Servizi</h1>
        <AddServiceButton>
          <PlusCircle className="mr-2 h-4 w-4" />
          Aggiungi Servizio
        </AddServiceButton>
      </div>
      <ServiceList />
    </div>
  )
}

