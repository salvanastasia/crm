"use client"

import { createMockClient } from "../mock-client"

// InstantDB client wrapper (currently backed by mock data)
let instantClient: ReturnType<typeof createMockClient> | null = null

export const getInstantClient = () => {
  if (!instantClient) {
    instantClient = createMockClient()
  }

  return instantClient
}
