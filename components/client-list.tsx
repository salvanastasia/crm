"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { EditClientDialog } from "@/components/edit-client-dialog"
import { useAuth } from "@/components/auth-context"
import { getClients, deleteClient } from "@/lib/actions"
import type { Client } from "@/lib/types"

export function ClientList() {
  const { user } = useAuth()
  const barberId = user?.barberId
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (!barberId) {
      setIsLoadingClients(false)
      setClients([])
      setFilteredClients([])
      return
    }
    const loadClients = async () => {
      setIsLoadingClients(true)
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'pre-fix-client',hypothesisId:'B',location:'components/client-list.tsx',message:'loadClients:start',data:{hasBarberId:!!barberId},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      try {
        const data = await getClients(barberId)
        setClients(data)
        setFilteredClients(data)
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'pre-fix-client',hypothesisId:'B',location:'components/client-list.tsx',message:'loadClients:done',data:{count:(data??[]).length},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
      } finally {
        setIsLoadingClients(false)
      }
    }

    void loadClients()
  }, [barberId])

  useEffect(() => {
    if (!barberId) return
    const onClientsUpdated = (evt: Event) => {
      const detail = (evt as CustomEvent<{ barberId?: string }>).detail
      if (detail?.barberId && detail.barberId !== barberId) return
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'pre-fix-client',hypothesisId:'A',location:'components/client-list.tsx',message:'clientsUpdated event',data:{matches:true},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      void (async () => {
        const data = await getClients(barberId)
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-client-invite',hypothesisId:'J',location:'components/client-list.tsx',message:'clientsUpdated:refetch:done',data:{count:(data??[]).length,sample:(data??[]).slice(0,2).map(c=>({email:c.email,phone:c.phone,name:c.name}))},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        setClients(data)
        setFilteredClients(data)
      })()
    }

    window.addEventListener("clientsUpdated", onClientsUpdated)
    return () => window.removeEventListener("clientsUpdated", onClientsUpdated)
  }, [barberId])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredClients(
        clients.filter(
          (client) =>
            client.name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query) ||
            client.phone.includes(query),
        ),
      )
    }
  }, [searchQuery, clients])

  const handleDelete = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete.id)
      setClients(clients.filter((client) => client.id !== clientToDelete.id))
      setFilteredClients(filteredClients.filter((client) => client.id !== clientToDelete.id))
      setClientToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleEdit = (client: Client) => {
    setClientToEdit(client)
    setIsEditDialogOpen(true)
  }

  const handleClientUpdated = (updatedClient: Client) => {
    const updatedClients = clients.map((client) => (client.id === updatedClient.id ? updatedClient : client))
    setClients(updatedClients)
    setFilteredClients(filteredClients.map((client) => (client.id === updatedClient.id ? updatedClient : client)))
    setClientToEdit(null)
    setIsEditDialogOpen(false)
  }

  const getClientInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "C"

  return (
    <>
      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          {isLoadingClients ? (
            <Skeleton className="h-10 w-full rounded-md" />
          ) : (
            <Input
              placeholder="Cerca cliente..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Appuntamenti</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingClients ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  {searchQuery ? "Nessun cliente trovato" : "Nessun cliente disponibile"}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.imageUrl || ""} alt={client.name} />
                        <AvatarFallback>{getClientInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{client.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.appointmentsCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setClientToDelete(client)
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
              Questa azione non può essere annullata. Il cliente verrà eliminato permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {clientToEdit && (
        <EditClientDialog
          client={clientToEdit}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </>
  )
}

