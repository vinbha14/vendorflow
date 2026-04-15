// lib/auth-handlers.ts
// Exports GET and POST handlers for the NextAuth route.
// Kept separate from lib/auth.ts so server actions can import auth()
// without pulling in the full handler bundle.

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
