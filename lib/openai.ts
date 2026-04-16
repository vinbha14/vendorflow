// lib/openai.ts
// OpenAI client singleton.
// Keeps all model references and cost math in one place.

import OpenAI from "openai"
import { AI_CONFIG } from "@/config/constants"

const globalForOpenAI = globalThis as unknown as { openai: OpenAI | undefined }

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"] ?? "",
  })

if (process.env["NODE_ENV"] !== "production") {
  globalForOpenAI.openai = openai
}

// ─── Cost estimation (USD per 1M tokens, as of gpt-4o and text-embedding-3-small) ───
const COST_PER_1M: Record<string, { input: number; output: number }> = {
  "gpt-4o":                      { input: 2.50,  output: 10.00 },
  "gpt-4o-mini":                 { input: 0.15,  output: 0.60  },
  "gpt-4-turbo":                 { input: 10.00, output: 30.00 },
  "text-embedding-3-small":      { input: 0.02,  output: 0     },
  "text-embedding-3-large":      { input: 0.13,  output: 0     },
}

export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens = 0
): number {
  const rates = COST_PER_1M[model]
  if (!rates) return 0
  return (
    (promptTokens / 1_000_000) * rates.input +
    (completionTokens / 1_000_000) * rates.output
  )
}

// ─── Rough token estimator (4 chars ≈ 1 token for English text) ───
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ─── Truncate text to a max token budget ───
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + "\n[...truncated for length]"
}

export { AI_CONFIG }
