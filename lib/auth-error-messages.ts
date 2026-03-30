const AUTH_ERROR_MAP: Array<{ match: RegExp; message: string }> = [
  { match: /invalid login credentials/i, message: "Email o password non valide." },
  { match: /email not confirmed/i, message: "Conferma prima la tua email per poter accedere." },
  { match: /user already registered/i, message: "Esiste gia' un account con questa email." },
  { match: /password should be at least/i, message: "La password e' troppo corta." },
  { match: /unable to validate email address/i, message: "Inserisci un indirizzo email valido." },
  { match: /email address .*invalid/i, message: "Inserisci un indirizzo email valido." },
  { match: /same password/i, message: "La nuova password deve essere diversa da quella attuale." },
  { match: /token has expired|token is expired/i, message: "Il link di recupero e' scaduto. Richiedine uno nuovo." },
  { match: /token.*invalid|invalid token/i, message: "Il link di recupero non e' valido." },
  { match: /too many requests|rate limit|over_email_send_rate_limit/i, message: "Troppi tentativi. Attendi qualche minuto e riprova." },
  { match: /network request failed|failed to fetch/i, message: "Problema di rete. Controlla la connessione e riprova." },
]

export function toItalianAuthErrorMessage(rawMessage?: string | null): string {
  const message = String(rawMessage ?? "").trim()
  if (!message) return "Si e' verificato un errore di autenticazione. Riprova."

  for (const entry of AUTH_ERROR_MAP) {
    if (entry.match.test(message)) return entry.message
  }

  return "Si e' verificato un errore di autenticazione. Riprova."
}

