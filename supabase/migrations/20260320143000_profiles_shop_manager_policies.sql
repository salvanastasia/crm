-- Enable shop admin/staff to manage client profiles for their barber_id.
-- This unblocks:
--  - "no email" inserts (client placeholder profiles row)
--  - "email provided" upserts done by salon/admin UI

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT client profiles for the shop
DROP POLICY IF EXISTS "profiles_shop_manager_select_client_profiles" ON public.profiles;
CREATE POLICY "profiles_shop_manager_select_client_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'client'
  AND barber_id IS NOT NULL
  AND barber_id = (
    SELECT p2.barber_id
    FROM public.profiles p2
    WHERE p2.id = auth.uid()
      AND p2.role IN ('admin', 'staff')
      AND p2.barber_id IS NOT NULL
    LIMIT 1
  )
);

-- INSERT client profiles for the shop
DROP POLICY IF EXISTS "profiles_shop_manager_insert_client_profiles" ON public.profiles;
CREATE POLICY "profiles_shop_manager_insert_client_profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'client'
  AND barber_id IS NOT NULL
  AND barber_id = (
    SELECT p2.barber_id
    FROM public.profiles p2
    WHERE p2.id = auth.uid()
      AND p2.role IN ('admin', 'staff')
      AND p2.barber_id IS NOT NULL
    LIMIT 1
  )
);

-- UPDATE client profiles for the shop
DROP POLICY IF EXISTS "profiles_shop_manager_update_client_profiles" ON public.profiles;
CREATE POLICY "profiles_shop_manager_update_client_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  role = 'client'
  AND barber_id IS NOT NULL
  AND barber_id = (
    SELECT p2.barber_id
    FROM public.profiles p2
    WHERE p2.id = auth.uid()
      AND p2.role IN ('admin', 'staff')
      AND p2.barber_id IS NOT NULL
    LIMIT 1
  )
)
WITH CHECK (
  role = 'client'
  AND barber_id IS NOT NULL
  AND barber_id = (
    SELECT p2.barber_id
    FROM public.profiles p2
    WHERE p2.id = auth.uid()
      AND p2.role IN ('admin', 'staff')
      AND p2.barber_id IS NOT NULL
    LIMIT 1
  )
);

