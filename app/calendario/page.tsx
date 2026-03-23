"use client"

import { useState } from "react"
import { Calendar } from "@/components/calendar"
import { AppointmentsList } from "@/components/appointments-list"

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Calendario</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>
        <div>
          <AppointmentsList selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  )
}

