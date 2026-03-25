"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Search, CheckCircle, XCircle } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EditResourceDialog } from "@/components/edit-resource-dialog"
import { useAuth } from "@/components/auth-context"
import { ensureOwnerResource, getResources, deleteResource, getServices } from "@/lib/actions"
import type { Resource, Service } from "@/lib/types"

export function ResourceList() {
  const { user } = useAuth()
  const barberId = user?.barberId
  const [didEnsureOwner, setDidEnsureOwner] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (!barberId) {
      setResources([])
      setFilteredResources([])
      setServices([])
      return
    }
    const loadData = async () => {
      // Ensure the logged-in admin appears in the Team list as a resource.
      if (user?.role === "admin" && !didEnsureOwner) {
        await ensureOwnerResource(barberId)
        setDidEnsureOwner(true)
      }
      const resourcesData = await getResources(barberId)
      const servicesData = await getServices(barberId)
      setResources(resourcesData)
      setFilteredResources(resourcesData)
      setServices(servicesData)
    }

    void loadData()
  }, [barberId, didEnsureOwner, user?.role])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResources(resources)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredResources(
        resources.filter(
          (resource) =>
            resource.name.toLowerCase().includes(query) ||
            resource.email.toLowerCase().includes(query) ||
            resource.role.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, resources])

  const handleDelete = async () => {
    if (resourceToDelete) {
      await deleteResource(resourceToDelete.id)
      setResources(resources.filter((resource) => resource.id !== resourceToDelete.id))
      setFilteredResources(filteredResources.filter((resource) => resource.id !== resourceToDelete.id))
      setResourceToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleEdit = (resource: Resource) => {
    setResourceToEdit(resource)
    setIsEditDialogOpen(true)
  }

  const handleResourceUpdated = (updatedResource: Resource) => {
    const updatedResources = resources.map((resource) =>
      resource.id === updatedResource.id ? updatedResource : resource,
    )
    setResources(updatedResources)
    setFilteredResources(
      filteredResources.map((resource) => (resource.id === updatedResource.id ? updatedResource : resource)),
    )
    setResourceToEdit(null)
    setIsEditDialogOpen(false)
  }

  const getResourceInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getServiceNames = (serviceIds: string[] = []) => {
    return serviceIds
      .map((id) => services.find((service) => service.id === id)?.name || "")
      .filter((name) => name !== "")
      .join(", ")
  }

  const getRoleLabel = (role: string) => role.replace(/barbiere/gi, "Collaboratore")

  return (
    <>
      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca collaboratore..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collaboratore</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Contatti</TableHead>
              <TableHead>Servizi</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  {searchQuery ? "Nessun collaboratore trovato" : "Nessun collaboratore disponibile"}
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={resource.imageUrl || ""} />
                        <AvatarFallback>{getResourceInitials(resource.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{resource.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleLabel(resource.role)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{resource.email}</span>
                      <span className="text-sm text-muted-foreground">{resource.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getServiceNames(resource.serviceIds)}</span>
                  </TableCell>
                  <TableCell>
                    {resource.isActive ? (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" /> Attivo
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <XCircle className="mr-1 h-3 w-3" /> Inattivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(resource)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setResourceToDelete(resource)
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
              Questa azione non puo' essere annullata. Il collaboratore verra' eliminato permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {resourceToEdit && (
        <EditResourceDialog
          resource={resourceToEdit}
          services={services}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onResourceUpdated={handleResourceUpdated}
        />
      )}
    </>
  )
}

