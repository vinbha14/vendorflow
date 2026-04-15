// jobs/ai-jobs.ts
// Trigger.dev background job definitions.
// These run outside the request lifecycle — no timeouts, built-in retries.
//
// To trigger from your app:
//   import { summarizeCvJob } from "@/jobs/ai-jobs"
//   await summarizeCvJob.trigger({ profileId: "..." })

import { task, retry } from "@trigger.dev/sdk/v3"
import { generateCvSummary } from "@/services/ai/cv-summary.service"
import { detectDuplicates } from "@/services/ai/duplicate-detection.service"
import { prisma } from "@/lib/prisma"

// ─── Job 1: CV Summarization ──────────────────────────────────────────────────
export const summarizeCvJob = task({
  id: "summarize-cv",
  // Retry up to 3 times with exponential backoff
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 60_000,
  },
  run: async (payload: { profileId: string }) => {
    const { profileId } = payload

    console.log(`[Job: summarize-cv] Starting for profile ${profileId}`)

    const result = await generateCvSummary(profileId)

    if (!result.success) {
      // Throw to trigger retry
      throw new Error(`CV summary failed: ${result.error}`)
    }

    console.log(`[Job: summarize-cv] ✓ Completed for profile ${profileId}`)
    return { success: true, profileId }
  },
})

// ─── Job 2: Duplicate Detection ──────────────────────────────────────────────
export const detectDuplicatesJob = task({
  id: "detect-duplicates",
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 3_000,
    maxTimeoutInMs: 30_000,
  },
  run: async (payload: { profileId: string; companyId: string }) => {
    const { profileId, companyId } = payload

    console.log(
      `[Job: detect-duplicates] Starting for profile ${profileId} in company ${companyId}`
    )

    const result = await detectDuplicates(profileId, companyId)

    console.log(
      `[Job: detect-duplicates] ✓ Created ${result.alertsCreated} alerts for profile ${profileId}`
    )

    return result
  },
})

// ─── Job 3: Daily usage metering ─────────────────────────────────────────────
export const recordDailyUsageJob = task({
  id: "record-daily-usage",
  run: async () => {
    console.log("[Job: record-daily-usage] Recording daily vendor counts")

    const subscriptions = await prisma.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
      select: { id: true, companyId: true },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let recorded = 0
    for (const sub of subscriptions) {
      const [vendorCount, candidateCount, aiSummaryCount] = await Promise.all([
        prisma.vendorCompany.count({
          where: { companyId: sub.companyId, status: "APPROVED" },
        }),
        prisma.candidateSubmission.count({
          where: {
            companyId: sub.companyId,
            submittedAt: { gte: today },
          },
        }),
        prisma.aiSummary.count({
          where: {
            status: "COMPLETED",
            generatedAt: { gte: today },
            profile: {
              submissions: { some: { companyId: sub.companyId } },
            },
          },
        }),
      ])

      await prisma.usageRecord.create({
        data: {
          subscriptionId: sub.id,
          vendorCount,
          candidateCount,
          aiSummaryCount,
          recordedAt: new Date(),
          periodStart: today,
          periodEnd: tomorrow,
        },
      })

      // Update active vendor count on subscription
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { activeVendorCount: vendorCount },
      })

      recorded++
    }

    console.log(`[Job: record-daily-usage] ✓ Recorded ${recorded} subscription usage snapshots`)
    return { recorded }
  },
})

// ─── Job 4: Send subscription trial ending reminder ──────────────────────────
export const trialEndingReminderJob = task({
  id: "trial-ending-reminder",
  run: async () => {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)

    // Find trials ending in ~3 days
    const endingSoon = await prisma.subscription.findMany({
      where: {
        status: "TRIALING",
        trialEndsAt: {
          gte: oneDayFromNow,
          lte: threeDaysFromNow,
        },
      },
      include: {
        company: {
          include: {
            members: {
              where: { role: "COMPANY_ADMIN", isActive: true },
              include: { user: { select: { email: true, name: true } } },
            },
          },
        },
        plan: { select: { displayName: true } },
      },
    })

    for (const sub of endingSoon) {
      const admin = sub.company.members[0]
      if (!admin) continue

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: admin.userId,
          companyId: sub.companyId,
          type: "BILLING_TRIAL_ENDING",
          title: "Trial ends in 3 days",
          body: `Your ${sub.plan.displayName} trial ends soon. Add a payment method to continue without interruption.`,
          link: "/dashboard/billing",
        },
      }).catch(() => {})

      // TODO: Send email via Resend
      // await sendTrialEndingEmail(admin.user.email, admin.user.name, sub.trialEndsAt)
    }

    console.log(`[Job: trial-ending-reminder] Notified ${endingSoon.length} trials`)
    return { notified: endingSoon.length }
  },
})
