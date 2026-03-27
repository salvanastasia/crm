# App mobile (Capacitor + WebView)

La shell nativa (`mobile/ios`, `mobile/android`) carica il sito Next.js pubblicato (consigliato: **HTTPS su Vercel**). La navigazione principale su device è la **bottom bar React** (vedi `components/mobile-bottom-nav.tsx`), visibile solo quando `Capacitor.isNativePlatform()` è vero.

## Prerequisiti

- Node.js (stesso del progetto web)
- **Xcode** (macOS) per build iOS
- **Android Studio** + **JDK** per build Android

## Variabili ambiente (sincronizzazione nativa)

`capacitor.config.ts` legge le variabili **al momento di `npx cap sync`**, non da `.env.local` di Next (a meno che non usi un tool che le esporta nella shell).

| Variabile | Descrizione |
|-----------|-------------|
| `CAP_SERVER_URL` | URL base del sito nella WebView. Se omesso, [`capacitor.config.ts`](../capacitor.config.ts) usa il deploy predefinito `https://toelettatura.vercel.app`. Per dev su LAN imposta es. `http://192.168.x.x:3000` e `CAP_SERVER_CLEARTEXT=true`. |
| `CAP_SERVER_CLEARTEXT` | `true` solo in dev per `http://` (es. `http://192.168.1.10:3000`). Su Android serve anche `android:usesCleartextTraffic` già gestito in debug da Capacitor; **mai in produzione**. |
| `CAP_APP_ID` | Bundle id (default `com.grooma.app`). |
| `CAP_APP_NAME` | Nome visualizzato (default `Barber CRM`). |

Esempio prima di aprire Xcode/Android Studio:

```bash
export CAP_SERVER_URL=https://toelettatura.vercel.app   # opzionale: è già il default in capacitor.config.ts
npx cap sync
npx cap open ios
```

Dev locale sulla LAN:

```bash
export CAP_SERVER_URL=http://TUO_IP_LAN:3000
export CAP_SERVER_CLEARTEXT=true
npx cap sync
```

## Script npm

| Script | Azione |
|--------|--------|
| `npm run cap:sync` | Copia `www`, aggiorna plugin e progetti nativi |
| `npm run cap:open:ios` | Apre il workspace iOS |
| `npm run cap:open:android` | Apre Android Studio |

Dopo ogni cambio a `capacitor.config.ts` o plugin, eseguire `npm run cap:sync`.

## Supabase Auth e redirect

1. **Supabase Dashboard** → Authentication → URL configuration:
   - **Site URL**: `https://toelettatura.vercel.app` (o il dominio custom).
   - **Redirect URLs**: includi almeno  
     `https://toelettatura.vercel.app/auth/callback`  
     e gli stessi URL che usi già per password reset / magic link.

2. **Universal Links / App Links** (opzionale): se il provider OAuth riapre l’app con un URL **https**, il bridge in `components/capacitor-deep-link-bridge.tsx` ricarica quella URL nella WebView.

3. **Custom URL scheme** (es. `com.grooma.app://…`): va registrato in iOS/Android **e** in Supabase come redirect; spesso serve logica aggiuntiva per mappare lo scheme all’URL https del sito. Per semplicità si consiglia di mantenere callback **HTTPS** dove possibile.

4. Email di conferma: il link deve puntare a un URL raggiungibile dalla WebView (stesso dominio del `CAP_SERVER_URL` in produzione).

## UI web rilevante

- Rilevamento native: `hooks/use-is-capacitor-native.ts`
- Bottom bar cliente vs staff: `lib/mobile-nav.ts`, `components/mobile-bottom-nav.tsx`
- Layout e padding safe-area: `components/app-shell.tsx`
- Su staff in app nativa la **nav orizzontale desktop** in header è nascosta (si usa la bottom bar): `components/header.tsx`

## Push notifications (background/closed app)

Per ricevere notifiche quando l'app e' in background o chiusa:

1. **Plugin Capacitor**
   - dipendenze: `@capacitor/push-notifications` e `@capacitor/local-notifications`
   - dopo update: `npm run cap:sync`

2. **Supabase migration**
   - applicare la migration `supabase/migrations/20260326104000_push_devices.sql`
   - crea tabella `push_devices` dove salvare i token device.

3. **FCM/APNs setup**
   - Android: configura Firebase nel progetto Android (`google-services.json` + Firebase project).
   - iOS: configura APNs in Apple Developer + Firebase Cloud Messaging per iOS.
   - abilita capability Push Notifications su Xcode.

4. **Variabili ambiente server**
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON del service account Firebase per `firebase-admin`)
   - `SUPABASE_SERVICE_ROLE_KEY` (usata server-side per leggere token/staff recipients)
   - `NEXT_PUBLIC_SUPABASE_URL`

5. **Flusso implementato**
   - app native registra il token push su login (`/api/push/register`)
   - backend salva/aggiorna token in `push_devices`
   - quando viene inserita una riga in `notifications`, il server invia push remoto ai device destinatari

## Commit del codice nativo

Le cartelle `mobile/ios` e `mobile/android` sono generate da Capacitor ma di solito **si versionano** nel repo così il team può aprire subito i progetti. Aggiornale dopo `cap add` / `cap sync` significativi.
