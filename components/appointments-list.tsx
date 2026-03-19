import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AppointmentsList() {
  const appointments = [
    {
      id: 1,
      client: "Marco Rossi",
      service: "Taglio + Barba",
      time: "10:00",
      status: "confermato",
    },
    {
      id: 2,
      client: "Luca Bianchi",
      service: "Taglio Capelli",
      time: "11:30",
      status: "confermato",
    },
    {
      id: 3,
      client: "Giuseppe Verdi",
      service: "Barba",
      time: "14:00",
      status: "in attesa",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appuntamenti di Oggi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <p className="text-center text-muted-foreground">Nessun appuntamento per oggi</p>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col space-y-2 border-b pb-4 last:border-0">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{appointment.client}</div>
                  <Badge variant={appointment.status === "confermato" ? "default" : "outline"}>
                    {appointment.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {appointment.service} - {appointment.time}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

