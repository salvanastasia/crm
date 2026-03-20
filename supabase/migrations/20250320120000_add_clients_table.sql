-- CRM walk-in / manual clients (not necessarily auth users)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  barber_id UUID NOT NULL REFERENCES public.barbers (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_barber_id_idx ON public.clients (barber_id);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_shop_access" ON public.clients;

CREATE POLICY "clients_shop_access" ON public.clients FOR ALL USING (
  barber_id IN (
    SELECT p.barber_id
    FROM public.profiles p
    WHERE
      p.id = auth.uid ()
      AND p.barber_id IS NOT NULL
  )
)
WITH CHECK (
  barber_id IN (
    SELECT p.barber_id
    FROM public.profiles p
    WHERE
      p.id = auth.uid ()
      AND p.barber_id IS NOT NULL
  )
);
