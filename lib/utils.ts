// lib/utils.ts
// Shared utility functions used across the entire codebase.

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ─── Tailwind class merging ───────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date formatting ──────────────────────────────────────────────────────────
export function formatDate(
  date: Date | string,
  opts?: { timezone?: string; format?: "short" | "medium" | "long" | "relative" }
): string {
  const d = typeof date === "string" ? new Date(date) : date
  const tz = opts?.timezone ?? "UTC"
  const fmt = opts?.format ?? "medium"

  if (fmt === "relative") {
    return formatRelativeDate(d)
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    ...(fmt === "short"
      ? { month: "numeric", day: "numeric", year: "2-digit" }
      : fmt === "medium"
      ? { month: "short", day: "numeric", year: "numeric" }
      : { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
  }

  return new Intl.DateTimeFormat("en-US", options).format(d)
}

export function formatRelativeDate(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function formatDateTime(date: Date | string, timezone?: string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone ?? "UTC",
  }).format(d)
}

// ─── Currency formatting ──────────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency = "USD",
  opts?: { compact?: boolean }
): string {
  if (opts?.compact && amount >= 1_00_000 && currency === "INR") {
    // Indian number formatting: lakhs
    const lakhs = amount / 1_00_000
    return `₹${lakhs.toFixed(lakhs >= 10 ? 0 : 1)}L`
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: opts?.compact ? "compact" : "standard",
  }).format(amount)
}

export function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency = "INR",
  period = "ANNUAL"
): string {
  if (!min) return "Not specified"

  const periodLabel = period === "MONTHLY" ? "/mo" : period === "HOURLY" ? "/hr" : "/yr"

  if (currency === "INR") {
    const fmt = (n: number) => {
      if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}Cr`
      if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
      return `₹${n.toLocaleString("en-IN")}`
    }
    return `${fmt(min)}${max ? ` – ${fmt(max)}` : "+"}${periodLabel}`
  }

  const fmt = (n: number) => formatCurrency(n, currency)
  return `${fmt(min)}${max ? ` – ${fmt(max)}` : "+"}${periodLabel}`
}

// ─── String utilities ─────────────────────────────────────────────────────────
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}...`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function capitalize(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

// ─── File utilities ───────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? ""
}

export function isImageFile(filename: string): boolean {
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(getFileExtension(filename))
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === "pdf"
}

// ─── URL utilities ────────────────────────────────────────────────────────────
export function absoluteUrl(path: string): string {
  return `${process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"}${path}`
}

export function buildTenantUrl(slug: string, path = ""): string {
  const domain = process.env["NEXT_PUBLIC_APP_DOMAIN"] ?? "localhost:3000"
  const protocol = domain.includes("localhost") ? "http" : "https"
  return `${protocol}://${slug}.${domain}${path}`
}

// ─── Number utilities ─────────────────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

// ─── Async utilities ──────────────────────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === attempts - 1) throw err
      await sleep(delayMs * (i + 1))
    }
  }
  throw new Error("Retry failed")
}

// ─── Object utilities ─────────────────────────────────────────────────────────
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result as Omit<T, K>
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    result[key] = obj[key]!
  })
  return result
}

// ─── Validation utilities ─────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}
