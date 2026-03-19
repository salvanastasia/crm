import { PlusCircle } from "lucide-react"
import { ResourceList } from "@/components/resource-list"
import { AddResourceButton } from "@/components/add-resource-button"

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Risorse</h1>
        <AddResourceButton>
          <PlusCircle className="mr-2 h-4 w-4" />
          Aggiungi Risorsa
        </AddResourceButton>
      </div>
      <ResourceList />
    </div>
  )
}

