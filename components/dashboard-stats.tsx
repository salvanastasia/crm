import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Scissors, Users, Activity } from "lucide-react"

export function DashboardStats() {
  const stats = [
    {
      title: "Incasso Totale",
      value: "€2,450.50",
      change: "+20.1% rispetto al mese scorso",
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      iconBg: "bg-primary/5 dark:bg-primary/10",
    },
    {
      title: "Appuntamenti",
      value: "+124",
      change: "+12.5% rispetto al mese scorso",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      iconBg: "bg-blue-500/5 dark:bg-blue-500/10",
    },
    {
      title: "Servizi Venduti",
      value: "+348",
      change: "+19% rispetto al mese scorso",
      icon: <Scissors className="h-4 w-4 text-muted-foreground" />,
      iconBg: "bg-green-500/5 dark:bg-green-500/10",
    },
    {
      title: "Clienti Attivi",
      value: "+57",
      change: "+5 nell'ultima ora",
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
      iconBg: "bg-yellow-500/5 dark:bg-yellow-500/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div className={`rounded-full p-2 ${stat.iconBg}`}>{stat.icon}</div>
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

