-- Crea una policy che consente l'accesso pubblico in sola lettura alla tabella business_settings
CREATE POLICY "Allow public read access to business_settings" 
ON business_settings 
FOR SELECT 
USING (true);

-- Policy per consentire l'inserimento nella tabella profiles
CREATE POLICY "Consenti inserimento profilo all'utente stesso" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy per consentire la lettura del proprio profilo
CREATE POLICY "Consenti lettura profilo all'utente stesso" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy per consentire l'aggiornamento del proprio profilo
CREATE POLICY "Consenti aggiornamento profilo all'utente stesso" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Policy per consentire agli admin di leggere tutti i profili
CREATE POLICY "Consenti agli admin di leggere tutti i profili" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Policy per consentire agli admin di aggiornare tutti i profili
CREATE POLICY "Consenti agli admin di aggiornare tutti i profili" 
ON profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

