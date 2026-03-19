import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Mock route - no database policies needed with mock data
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: "Mock mode: No database policies needed" 
  })
}

