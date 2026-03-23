-- Occupied time ranges per resource/day for booking UI and overlap checks.
-- Bypasses RLS for reads but only when caller belongs to the same barber (profiles.barber_id).
CREATE OR REPLACE FUNCTION public.get_booked_intervals_for_resource(
  p_barber_id uuid,
  p_resource_id uuid,
  p_date date,
  p_exclude_appointment_id uuid DEFAULT NULL
)
RETURNS TABLE (start_time text, duration_minutes integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    left(a.time::text, 5) AS start_time,
    (GREATEST(COALESCE(s.duration, 30), 5))::integer AS duration_minutes
  FROM public.appointments a
  LEFT JOIN public.services s
    ON s.id = a.service_id
    AND s.barber_id = a.barber_id
  WHERE a.barber_id = p_barber_id
    AND a.resource_id = p_resource_id
    AND a.date = p_date
    AND a.status <> 'cancelled'
    AND (p_exclude_appointment_id IS NULL OR a.id <> p_exclude_appointment_id)
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.barber_id IS NOT NULL
        AND p.barber_id = p_barber_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.resources r
      WHERE r.id = p_resource_id
        AND r.barber_id = p_barber_id
    )
  ORDER BY a.time;
$$;

REVOKE ALL ON FUNCTION public.get_booked_intervals_for_resource(uuid, uuid, date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_intervals_for_resource(uuid, uuid, date, uuid) TO authenticated;
