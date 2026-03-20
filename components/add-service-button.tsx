"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddServiceDialog } from "@/components/add-service-dialog"

export function AddServiceButton({ children }: { children?: ReactNode }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        {children ?? (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Servizio
          </>
        )}
      </Button>
      <AddServiceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

