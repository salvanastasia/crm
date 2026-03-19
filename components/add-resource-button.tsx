"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AddResourceDialog } from "@/components/add-resource-dialog"

interface AddResourceButtonProps {
  children: React.ReactNode
}

export function AddResourceButton({ children }: AddResourceButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>{children}</Button>
      <AddResourceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

