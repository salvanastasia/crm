-- Crea una policy per consentire l'accesso pubblico in lettura alla tabella business_settings
CREATE POLICY "Allow public read access to business_settings" 
ON business_settings 
FOR SELECT 
USING (true);

-- Crea una policy per consentire agli admin di modificare le impostazioni
CREATE POLICY "Allow admin to update business_settings" 
ON business_settings 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Crea una policy per consentire agli admin di inserire nuove impostazioni
CREATE POLICY "Allow admin to insert business_settings" 
ON business_settings 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

