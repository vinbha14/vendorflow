// trigger.config.ts
import { defineConfig } from "@trigger.dev/sdk/v3"

export default defineConfig({
  // Your Trigger.dev project reference (from trigger.dev dashboard)
  project: process.env["TRIGGER_PROJECT_REF"] ?? "proj_vendorflow",

  // Where to find your job definitions
  dirs: ["./jobs"],

  // Retry configuration (global defaults, can be overridden per task)
  retries: {
    enabledInDev: false, // Disable retries in local dev for faster iteration
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1_000,
      maxTimeoutInMs: 60_000,
      randomize: true,
    },
  },

  // Machine configuration for AI tasks (they need more memory)
  machine: {
    preset: "small-1x", // 0.5 vCPU, 500MB RAM — enough for GPT-4o calls
  },
})
