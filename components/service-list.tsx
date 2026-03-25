"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EditServiceDialog } from "@/components/edit-service-dialog"
import { useAuth } from "@/components/auth-context"
import { getServices, deleteService } from "@/lib/actions"
import type { Service } from "@/lib/types"

export function ServiceList() {
  const { user } = useAuth()
  const barberId = user?.barberId
  const [services, setServices] = useState<Service[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (!barberId) {
      setIsLoadingServices(false)
      setServices([])
      return
    }
    const loadServices = async () => {
      setIsLoadingServices(true)
      try {
        const data = await getServices(barberId)
        setServices(data)
      } finally {
        setIsLoadingServices(false)
      }
    }

    void loadServices()
  }, [barberId])

  useEffect(() => {
    if (!barberId) return
    const onServicesUpdated = (evt: Event) => {
      const detail = (evt as CustomEvent<{ barberId?: string }>).detail
      if (detail?.barberId && detail.barberId !== barberId) return
      void (async () => {
        const data = await getServices(barberId)
        setServices(data)
      })()
    }

    window.addEventListener("servicesUpdated", onServicesUpdated)
    return () => window.removeEventListener("servicesUpdated", onServicesUpdated)
  }, [barberId])

  const handleDelete = async () => {
    if (serviceToDelete) {
      await deleteService(serviceToDelete.id)
      setServices(services.filter((service) => service.id !== serviceToDelete.id))
      setServiceToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleEdit = (service: Service) => {
    setServiceToEdit(service)
    setIsEditDialogOpen(true)
  }

  const handleServiceUpdated = (updatedService: Service) => {
    setServices(services.map((service) => (service.id === updatedService.id ? updatedService : service)))
    setServiceToEdit(null)
    setIsEditDialogOpen(false)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Durata</TableHead>
              <TableHead>Prezzo</TableHead>
              <TableHead>Prezzo Comparativo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingServices ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell className="font-medium">
                    <Skeleton className="h-4 w-40 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nessun servizio disponibile. Aggiungi il tuo primo servizio!
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.duration} min</TableCell>
                  <TableCell>€{service.price.toFixed(2)}</TableCell>
                  <TableCell>{service.comparePrice ? `€${service.comparePrice.toFixed(2)}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setServiceToDelete(service)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il servizio verrà eliminato permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {serviceToEdit && (
        <EditServiceDialog
          service={serviceToEdit}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onServiceUpdated={handleServiceUpdated}
        />
      )}
    </>
  )
}

