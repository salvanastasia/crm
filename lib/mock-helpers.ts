// Helper functions to replace Supabase auth helpers with mock implementations
import { createMockClient } from "./mock-client"

// Replace createClientComponentClient
export function createClientComponentClient() {
  return createMockClient()
}

// Replace createRouteHandlerClient
export function createRouteHandlerClient(opts: { cookies: any }) {
  return createMockClient()
}

// Replace createMiddlewareClient
export function createMiddlewareClient(opts: { req: any; res: any }) {
  return createMockClient()
}

// Replace createServerComponentClient
export function createServerComponentClient(opts: { cookies: any }) {
  return createMockClient()
}

// Replace createServerActionClient (for server actions)
export function createServerActionClient(opts: { cookies: any }) {
  return createMockClient()
}

