-- Crea una funzione RPC per ottenere le impostazioni del brand
CREATE OR REPLACE FUNCTION public.get_business_settings()
RETURNS TABLE (
  id text,
  business_name text,
  brand_color text,
  logo_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    business_settings.id::text,
    business_settings.business_name,
    business_settings.brand_color,
    business_settings.logo_url
  FROM business_settings
  LIMIT 1;
END;
$$;

-- Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION public.get_business_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_settings() TO anon;
GRANT EXECUTE ON FUNCTION public.get_business_settings() TO service_role;

