import { createMockClient } from "../mock-client"

// InstantDB server wrapper (currently backed by mock data)
export const getInstantServer = () => {
  return createMockClient()
}
