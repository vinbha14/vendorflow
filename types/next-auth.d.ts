// types/next-auth.d.ts
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image?: string | null
      globalRole: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    globalRole: string
  }
}
