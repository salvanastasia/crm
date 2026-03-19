-- Elimina gli utenti esistenti se necessario (opzionale)
DELETE FROM auth.users WHERE email IN ('admin@barbercrm.com', 'cliente@example.com');
DELETE FROM public.profiles WHERE email IN ('admin@barbercrm.com', 'cliente@example.com');

-- Crea un utente admin
INSERT INTO auth.users (
  id, email, raw_user_meta_data, raw_app_meta_data, 
  encrypted_password, email_confirmed_at, created_at, updated_at, 
  confirmation_token, is_sso_user, confirmed_at
)
VALUES (
  gen_random_uuid(), 'admin@barbercrm.com', 
  '{"name":"Admin Test","role":"admin"}',
  '{"provider":"email","providers":["email"]}',
  crypt('Admin123!', gen_salt('bf')), 
  now(), now(), now(),
  '', false, now()
)
RETURNING id;

-- Inserisci il profilo admin
INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
SELECT id, 'Admin Test', 'admin@barbercrm.com', 'admin', now(), now()
FROM auth.users
WHERE email = 'admin@barbercrm.com';

-- Crea un utente cliente
INSERT INTO auth.users (
  id, email, raw_user_meta_data, raw_app_meta_data, 
  encrypted_password, email_confirmed_at, created_at, updated_at,
  confirmation_token, is_sso_user, confirmed_at
)
VALUES (
  gen_random_uuid(), 'cliente@example.com', 
  '{"name":"Cliente Test","role":"client"}',
  '{"provider":"email","providers":["email"]}',
  crypt('Cliente123!', gen_salt('bf')), 
  now(), now(), now(),
  '', false, now()
)
RETURNING id;

-- Inserisci il profilo cliente
INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
SELECT id, 'Cliente Test', 'cliente@example.com', 'client', now(), now()
FROM auth.users
WHERE email = 'cliente@example.com';

