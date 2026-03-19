-- Crea una funzione RPC per ottenere le impostazioni del business
CREATE OR REPLACE FUNCTION get_business_settings()
RETURNS SETOF business_settings
LANGUAGE sql
SECURITY DEFINER -- Esegue con i privilegi del creatore
AS $$
  SELECT * FROM business_settings LIMIT 1;
$$;

-- Concedi i permessi di esecuzione a tutti gli utenti autenticati
GRANT EXECUTE ON FUNCTION get_business_settings() TO authenticated;

