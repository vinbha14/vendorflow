// app/api/auth/[...nextauth]/route.ts
// This is the only file needed to wire NextAuth into Next.js App Router.
// All config lives in lib/auth.ts — this just re-exports the handlers.

export { GET, POST } from "@/lib/auth-handlers"
