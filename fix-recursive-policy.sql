-- Elimina le policy esistenti per la tabella profiles
DROP POLICY IF EXISTS "Consenti inserimento profilo all'utente stesso" ON profiles;
DROP POLICY IF EXISTS "Consenti lettura profilo all'utente stesso" ON profiles;
DROP POLICY IF EXISTS "Consenti aggiornamento profilo all'utente stesso" ON profiles;
DROP POLICY IF EXISTS "Consenti agli admin di leggere tutti i profili" ON profiles;
DROP POLICY IF EXISTS "Consenti agli admin di aggiornare tutti i profili" ON profiles;
DROP POLICY IF EXISTS "Consenti inserimento profilo" ON profiles;
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

-- Funzione per eseguire SQL
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concedi i permessi per eseguire la funzione
GRANT EXECUTE ON FUNCTION public.exec_sql TO service_role;

