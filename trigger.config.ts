// trigger.config.ts
import { defineConfig } from "@trigger.dev/sdk/v3"

export default defineConfig({
  project: process.env["TRIGGER_PROJECT_REF"] ?? "proj_vendorflow",
  dirs: ["./jobs"],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1_000,
      maxTimeoutInMs: 60_000,
      randomize: true,
    },
  },
  machine: "small-1x",
})
