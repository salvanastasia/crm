# Deploy su Vercel (dominio `*.vercel.app`)

## 1. Repository

Committa il codice e caricalo su **GitHub** (o GitLab / Bitbucket).

## shadcn preset (radix-nova / Hugeicons)

Il progetto usa `components.json` generato con il preset **`b7Uc9EiCB`** (stile **radix-nova**, base **taupe**, icone **Hugeicons**). Tema **chiaro/scuro**: classi `.dark` su `<html>` tramite `next-themes` in [`app/layout.tsx`](../app/layout.tsx).

In locale, `npx shadcn init -p …` può richiedere **solo npm** oppure `.npmrc` con `legacy-peer-deps=true` (già presente) se compaiono conflitti peer con React 19.

## 2. Nuovo progetto Vercel

1. Vai su [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. Importa il repository `barber-crm`.
3. **Framework Preset**: Next.js (rileva automaticamente).
4. **Build**: `npm run build` (default) · **Output**: default.

## 3. Variabili d’ambiente

In **Settings → Environment Variables** aggiungi almeno:

| Nome | Ambiente | Note |
|------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | URL progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tutti | chiave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (e Preview se serve) | opzionale; **non** esporre al client |
| `NEXT_PUBLIC_DEFAULT_BARBER_ID` | tutti | opzionale |

Vedi anche [`.env.example`](../.env.example).

## 4. Supabase (Auth)

Dopo il primo deploy, copia l’URL del sito, es. `https://barber-crm-xxx.vercel.app`.

In **Supabase Dashboard → Authentication → URL configuration**:

- **Site URL**: `https://barber-crm-xxx.vercel.app` (o il dominio custom).
- **Redirect URLs**: aggiungi  
  `https://barber-crm-xxx.vercel.app/**`  
  e per le preview:  
  `https://*.vercel.app/**`  
  (oppure i pattern che Supabase accetta per le tue preview).

In **OAuth / email**, verifica che i redirect puntino al dominio Vercel se usi magic link / OAuth.

## 5. Deploy

Clicca **Deploy**. Ogni push sul branch collegato genera un nuovo deploy.

### CLI (alternativa)

```bash
npm i -g vercel
cd barber-crm
vercel login
vercel          # preview
vercel --prod   # produzione
```

La CLI chiederà di collegare il progetto e potrà sincronizzare le env.

## 6. Dominio

- **Dominio Vercel**: già attivo come `nome-progetto-xxx.vercel.app`.
- **Dominio proprio**: **Project → Settings → Domains** → aggiungi il dominio e segui le istruzioni DNS.

## 7. Database

Le migration in `supabase/migrations/` vanno applicate sul progetto Supabase (`supabase db push` o SQL Editor), indipendentemente da Vercel.
