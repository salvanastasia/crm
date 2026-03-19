import { createMockClient } from "../mock-client"

// InstantDB admin/service wrapper (currently backed by mock data)
export const getInstantService = () => {
  return createMockClient()
}
