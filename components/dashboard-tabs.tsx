"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "overview", label: "Panoramica" },
  { id: "analytics", label: "Statistiche" },
  { id: "reports", label: "Report" },
  { id: "notifications", label: "Notifiche" },
]

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="flex space-x-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

