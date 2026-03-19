-- Funzione per confermare manualmente un utente
-- Questa funzione deve essere eseguita nel SQL Editor di Supabase
CREATE OR REPLACE FUNCTION confirm_user(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = now(),
      confirmed_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

