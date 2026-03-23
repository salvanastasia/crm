-- Prevent multiple active appointments on the same barber/resource/date/time slot.
-- Cancelled appointments are excluded so the slot can be reused.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_active_slot_idx
ON public.appointments (barber_id, resource_id, date, time)
WHERE status <> 'cancelled';
