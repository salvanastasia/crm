import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Mock auth callback - just redirects to home
export async function GET(request: NextRequest) {
  // In mock mode, just redirect to home
  return NextResponse.redirect(new URL("/", request.url))
}

