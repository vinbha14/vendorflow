// app/dashboard/settings/page.tsx
// /dashboard/settings redirects to the default settings tab.
import { redirect } from "next/navigation"

export default function SettingsIndexPage() {
  redirect("/dashboard/settings/company")
}
