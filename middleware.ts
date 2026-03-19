import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMockClient } from "@/lib/mock-client"

// Definisci le rotte pubbliche che non richiedono autenticazione
const publicRoutes = ["/login", "/signup", "/reset-password", "/update-password"]

// Funzione per verificare se una rotta è pubblica
function isPublicRoute(path: string) {
  return publicRoutes.some((route) => path === route || path.startsWith(`${route}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // In mock mode, allow all routes - authentication is handled client-side
  // The middleware will not block access, but client-side auth will handle redirects
  return response
}

// Configura il middleware per essere eseguito su tutte le rotte tranne quelle statiche
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

