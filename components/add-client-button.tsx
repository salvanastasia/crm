"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddClientDialog } from "@/components/add-client-dialog"

export function AddClientButton({ children }: { children?: ReactNode }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        {children ?? (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Cliente
          </>
        )}
      </Button>
      <AddClientDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

