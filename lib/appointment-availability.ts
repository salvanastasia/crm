import { format, isValid } from "date-fns"

export type BookedIntervalRow = { startTime: string; durationMinutes: number }

/** Calendar day key in local timezone (avoids UTC day shift from toISOString). */
export function appointmentCalendarDateKey(input: Date | string): string {
  if (typeof input === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) return input.trim()
    const d = new Date(input)
    return isValid(d) ? format(d, "yyyy-MM-dd") : ""
  }
  return format(input, "yyyy-MM-dd")
}

/** "HH:MM" or "HH:MM:SS" -> minutes from midnight */
export function timeStringToMinutes(t: string): number {
  const s = String(t).trim().slice(0, 8)
  const [h, m] = s.split(":").map((x) => Number(x))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

/** Half-open [aStart, aEnd) vs [bStart, bEnd) */
export function intervalsOverlapHalfOpen(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

export type BusyInterval = { startMin: number; endMin: number }

export function toBusyIntervals(rows: BookedIntervalRow[]): BusyInterval[] {
  return rows.map((r) => {
    const startMin = timeStringToMinutes(r.startTime)
    const dur = Math.max(5, Number(r.durationMinutes) || 30)
    return { startMin, endMin: startMin + dur }
  })
}

/** True if [slotStart, slotStart + slotDurationMin) overlaps any busy interval. */
export function slotOverlapsAnyBusy(slotStartMin: number, slotDurationMin: number, busy: BusyInterval[]): boolean {
  const d = Math.max(5, slotDurationMin)
  const end = slotStartMin + d
  return busy.some((b) => intervalsOverlapHalfOpen(slotStartMin, end, b.startMin, b.endMin))
}
