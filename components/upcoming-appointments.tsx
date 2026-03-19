import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function UpcomingAppointments() {
  const appointments = [
    {
      id: 1,
      client: {
        name: "Marco Rossi",
        avatar: "",
        initials: "MR",
      },
      service: "Taglio + Barba",
      time: "10:00",
      date: "Oggi",
      status: "confermato",
    },
    {
      id: 2,
      client: {
        name: "Luca Bianchi",
        avatar: "",
        initials: "LB",
      },
      service: "Taglio Capelli",
      time: "11:30",
      date: "Oggi",
      status: "confermato",
    },
    {
      id: 3,
      client: {
        name: "Giuseppe Verdi",
        avatar: "",
        initials: "GV",
      },
      service: "Barba",
      time: "14:00",
      date: "Oggi",
      status: "in attesa",
    },
    {
      id: 4,
      client: {
        name: "Andrea Neri",
        avatar: "",
        initials: "AN",
      },
      service: "Taglio + Shampoo",
      time: "09:30",
      date: "Domani",
      status: "confermato",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prossimi Appuntamenti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={appointment.client.avatar} />
                  <AvatarFallback>{appointment.client.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{appointment.client.name}</p>
                  <p className="text-sm text-muted-foreground">{appointment.service}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{appointment.time}</p>
                <p className="text-sm text-muted-foreground">{appointment.date}</p>
              </div>
              <Badge variant={appointment.status === "confermato" ? "default" : "outline"}>{appointment.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

