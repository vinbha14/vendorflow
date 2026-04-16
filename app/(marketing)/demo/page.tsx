// app/(marketing)/demo/page.tsx
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"

// Redirect /demo to sign-up since we don't have a live demo yet
export default function DemoPage() {
  redirect(ROUTES.SIGN_UP)
}
