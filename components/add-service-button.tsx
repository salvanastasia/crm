"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddServiceDialog } from "@/components/add-service-dialog"

export function AddServiceButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Aggiungi Servizio
      </Button>
      <AddServiceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

