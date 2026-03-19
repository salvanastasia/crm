-- Elimina le policy esistenti per la tabella profiles
DROP POLICY IF EXISTS "Consenti inserimento profilo all'utente stesso" ON profiles;
DROP POLICY IF EXISTS "Consenti lettura profilo all'utente stesso" ON profiles;
DROP POLICY IF EXISTS "Consenti aggiornamento profilo all'utente stesso" ON profiles;
DROP POLICY IF EXISTS "Consenti agli admin di leggere tutti i profili" ON profiles;
DROP POLICY IF EXISTS "Consenti agli admin di aggiornare tutti i profili" ON profiles;
DROP POLICY IF EXISTS "Consenti inserimento profilo" ON profiles;

-- Crea una policy che consente l'inserimento di nuovi profili senza restrizioni
-- Questa è necessaria per la registrazione
CREATE POLICY "Consenti inserimento profilo" 
ON profiles 
FOR INSERT 
WITH CHECK (true);

-- Crea una policy che consente la lettura del proprio profilo
CREATE POLICY "Consenti lettura profilo all'utente stesso" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Crea una policy che consente l'aggiornamento del proprio profilo
CREATE POLICY "Consenti aggiornamento profilo all'utente stesso" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Crea una policy che consente agli admin di leggere tutti i profili
CREATE POLICY "Consenti agli admin di leggere tutti i profili" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Crea una policy che consente agli admin di aggiornare tutti i profili
CREATE POLICY "Consenti agli admin di aggiornare tutti i profili" 
ON profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Funzione per correggere la policy sulla tabella profiles
CREATE OR REPLACE FUNCTION public.fix_profiles_policy()
RETURNS void AS $$
BEGIN
  -- Elimina tutte le policy esistenti sulla tabella profiles
  DROP POLICY IF EXISTS "Profiles are viewable by users who created them" ON profiles;
  DROP POLICY IF EXISTS "Profiles are editable by users who created them" ON profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
  
  -- Crea una nuova policy sicura per la visualizzazione
  CREATE POLICY "Profiles are viewable by authenticated users" 
  ON profiles FOR SELECT 
  USING (auth.role() = 'authenticated');
  
  -- Crea una nuova policy sicura per la modifica
  CREATE POLICY "Profiles are editable by users who created them" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
  
  -- Crea una nuova policy sicura per l'inserimento
  CREATE POLICY "Profiles can be inserted by authenticated users" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concedi i permessi per eseguire la funzione
GRANT EXECUTE ON FUNCTION public.fix_profiles_policy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_profiles_policy() TO service_role;

