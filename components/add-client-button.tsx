"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddClientDialog } from "@/components/add-client-dialog"

export function AddClientButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Aggiungi Cliente
      </Button>
      <AddClientDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

