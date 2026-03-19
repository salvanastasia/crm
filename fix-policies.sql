-- Elimina le policy problematiche per la tabella profiles
DROP POLICY IF EXISTS "Consenti agli admin di leggere tutti i profili" ON profiles;

-- Crea una policy più sicura per gli admin
CREATE POLICY "Consenti agli admin di leggere tutti i profili" 
ON profiles 
FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Assicurati che la policy per business_settings sia corretta
DROP POLICY IF EXISTS "Allow public read access to business_settings" ON business_settings;

CREATE POLICY "Allow public read access to business_settings" 
ON business_settings 
FOR SELECT 
USING (true);

-- Abilita RLS sulla tabella business_settings se non è già abilitata
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

