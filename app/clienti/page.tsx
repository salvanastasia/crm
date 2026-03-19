import { PlusCircle } from "lucide-react"
import { ClientList } from "@/components/client-list"
import { AddClientButton } from "@/components/add-client-button"

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clienti</h1>
        <AddClientButton>
          <PlusCircle className="mr-2 h-4 w-4" />
          Aggiungi Cliente
        </AddClientButton>
      </div>
      <ClientList />
    </div>
  )
}

