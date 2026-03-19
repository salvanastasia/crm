import { Calendar } from "@/components/calendar"
import { AppointmentsList } from "@/components/appointments-list"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Calendario</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar />
        </div>
        <div>
          <AppointmentsList />
        </div>
      </div>
    </div>
  )
}

