import type { CapacitorConfig } from "@capacitor/cli"

/**
 * WebView loads il deploy Next.js. Override con CAP_SERVER_URL (shell) per LAN in dev.
 * Default: produzione Vercel del progetto.
 */
const DEFAULT_SERVER_URL = "https://toelettatura.vercel.app"

const serverUrl = process.env.CAP_SERVER_URL?.replace(/\/$/, "") || DEFAULT_SERVER_URL

const config: CapacitorConfig = {
  appId: process.env.CAP_APP_ID || "com.grooma.app",
  appName: process.env.CAP_APP_NAME || "Grooma",
  webDir: "mobile/www",
  server: {
    url: serverUrl,
    cleartext: process.env.CAP_SERVER_CLEARTEXT === "true",
  },
  ios: {
    path: "mobile/ios",
    contentInset: "automatic",
  },
  android: {
    path: "mobile/android",
  },
}

export default config
