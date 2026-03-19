import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentAppointments() {
  const appointments = [
    {
      id: 1,
      client: {
        name: "Marco Rossi",
        email: "marco.rossi@example.com",
        avatar: "",
        initials: "MR",
      },
      service: "Taglio + Barba",
      amount: "€35.00",
    },
    {
      id: 2,
      client: {
        name: "Luca Bianchi",
        email: "luca.bianchi@example.com",
        avatar: "",
        initials: "LB",
      },
      service: "Taglio Capelli",
      amount: "€25.00",
    },
    {
      id: 3,
      client: {
        name: "Giuseppe Verdi",
        email: "giuseppe.verdi@example.com",
        avatar: "",
        initials: "GV",
      },
      service: "Barba",
      amount: "€15.00",
    },
    {
      id: 4,
      client: {
        name: "Andrea Neri",
        email: "andrea.neri@example.com",
        avatar: "",
        initials: "AN",
      },
      service: "Taglio + Shampoo",
      amount: "€30.00",
    },
  ]

  return (
    <div className="space-y-6">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={appointment.client.avatar} />
              <AvatarFallback>{appointment.client.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{appointment.client.name}</p>
              <p className="text-sm text-muted-foreground">{appointment.client.email}</p>
            </div>
          </div>
          <div className="text-right font-medium">{appointment.amount}</div>
        </div>
      ))}
    </div>
  )
}

