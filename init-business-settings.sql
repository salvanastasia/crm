-- Verifica se la tabella business_settings esiste e creala se necessario
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Barber CRM',
  brand_color TEXT DEFAULT '#4f46e5',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserisci dati di esempio se la tabella è vuota
INSERT INTO public.business_settings (business_name, brand_color, logo_url)
SELECT 'Barber CRM', '#4f46e5', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);

-- Abilita RLS sulla tabella
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Crea una policy che consente l'accesso pubblico in sola lettura
DROP POLICY IF EXISTS "Allow public read access to business_settings" ON public.business_settings;
CREATE POLICY "Allow public read access to business_settings" 
ON public.business_settings 
FOR SELECT 
USING (true);

-- Crea una policy che consente agli admin di modificare le impostazioni
DROP POLICY IF EXISTS "Allow admin to update business_settings" ON public.business_settings;
CREATE POLICY "Allow admin to update business_settings" 
ON public.business_settings 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Crea una policy che consente agli admin di inserire nuove impostazioni
DROP POLICY IF EXISTS "Allow admin to insert business_settings" ON public.business_settings;
CREATE POLICY "Allow admin to insert business_settings" 
ON public.business_settings 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

