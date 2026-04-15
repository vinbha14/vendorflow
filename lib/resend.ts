// lib/resend.ts
// Resend email client with all transactional email functions.
// React Email templates live in /emails/*.tsx

import { Resend } from "resend"

const resend = new Resend(process.env["RESEND_API_KEY"] ?? "")

const FROM = process.env["RESEND_FROM_EMAIL"] ?? "noreply@vendorflow.com"
const FROM_NAME = process.env["RESEND_FROM_NAME"] ?? "VendorFlow"
const FROM_ADDRESS = `${FROM_NAME} <${FROM}>`

// ─────────────────────────────────────────────────────────────────────────────
// Generic send helper with error handling
// ─────────────────────────────────────────────────────────────────────────────
async function sendEmail(opts: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: typeof opts.to === "string" ? [opts.to] : opts.to,
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
    })

    if (error) {
      console.error("[Email] Resend error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error"
    console.error("[Email] Failed to send:", message)
    return { success: false, error: message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Vendor Invitation Email
// ─────────────────────────────────────────────────────────────────────────────
export async function sendVendorInvitationEmail(opts: {
  to: string
  vendorName: string
  companyName: string
  companyLogoUrl?: string
  primaryColor?: string
  inviteUrl: string
  message?: string
  inviterName: string
  expiresInDays: number
}) {
  const { to, vendorName, companyName, inviteUrl, message, inviterName, expiresInDays, primaryColor = "#4F46E5" } = opts

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:${primaryColor};padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${companyName}</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Vendor Portal Invitation</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Hello <strong>${vendorName}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
        <strong>${inviterName}</strong> from <strong>${companyName}</strong> has invited you to join their vendor portal on VendorFlow.
      </p>

      ${message ? `
      <div style="background:#f8f9fa;border-left:3px solid ${primaryColor};padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
        <p style="margin:0;font-size:14px;color:#555;font-style:italic;">"${message}"</p>
        <p style="margin:8px 0 0;font-size:12px;color:#888;">— ${inviterName}</p>
      </div>
      ` : ""}

      <p style="margin:24px 0 16px;font-size:14px;color:#666;">
        Once you accept the invitation, you'll be able to:
      </p>
      <ul style="margin:0 0 32px;padding-left:20px;color:#555;font-size:14px;line-height:2;">
        <li>Submit candidate profiles for open roles</li>
        <li>Track your submissions in real-time</li>
        <li>View company branding and open requirements</li>
        <li>Receive instant status updates on your candidates</li>
      </ul>

      <a href="${inviteUrl}" style="display:inline-block;background:${primaryColor};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Accept invitation →
      </a>

      <p style="margin:24px 0 0;font-size:12px;color:#999;">
        This invitation expires in ${expiresInDays} days. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e8e8e8;">
      <p style="margin:0;font-size:12px;color:#999;text-align:center;">
        Powered by <a href="https://vendorflow.com" style="color:#4F46E5;text-decoration:none;">VendorFlow</a> · 
        <a href="https://vendorflow.com/legal/privacy" style="color:#999;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`

  return sendEmail({
    to,
    subject: `You've been invited to join ${companyName}'s vendor portal`,
    html,
    replyTo: FROM,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Candidate Status Change Email (to vendor)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendCandidateStatusEmail(opts: {
  to: string
  vendorName: string
  candidateName: string
  companyName: string
  newStatus: string
  statusLabel: string
  notes?: string
  dashboardUrl: string
}) {
  const { to, vendorName, candidateName, companyName, statusLabel, notes, dashboardUrl } = opts

  const statusColors: Record<string, string> = {
    SHORTLISTED: "#10b981",
    HIRED: "#10b981",
    INTERVIEW: "#6366f1",
    OFFER_SENT: "#06b6d4",
    REJECTED: "#ef4444",
    UNDER_REVIEW: "#f59e0b",
  }
  const color = statusColors[opts.newStatus] ?? "#6b7280"

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#0f172a;padding:24px 40px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">Candidate Update</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">VendorFlow · ${companyName}</p>
    </div>
    <div style="padding:40px;">
      <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;">Hello ${vendorName},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
        The status of <strong>${candidateName}</strong> at <strong>${companyName}</strong> has been updated.
      </p>
      <div style="background:#f8f9fa;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">New status</p>
        <span style="display:inline-block;background:${color}20;color:${color};padding:6px 16px;border-radius:20px;font-weight:600;font-size:14px;">
          ${statusLabel}
        </span>
        ${notes ? `<p style="margin:16px 0 0;font-size:14px;color:#555;font-style:italic;">"${notes}"</p>` : ""}
      </div>
      <a href="${dashboardUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
        View in dashboard →
      </a>
    </div>
    <div style="background:#f8f9fa;padding:16px 40px;border-top:1px solid #e8e8e8;">
      <p style="margin:0;font-size:12px;color:#999;text-align:center;">VendorFlow · <a href="https://vendorflow.com" style="color:#4F46E5;">vendorflow.com</a></p>
    </div>
  </div>
</body>
</html>`

  return sendEmail({
    to,
    subject: `${candidateName} — Status updated to ${statusLabel} at ${companyName}`,
    html,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Payment failed / billing alert
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPaymentFailedEmail(opts: {
  to: string
  userName: string
  companyName: string
  amount: string
  billingUrl: string
  gracePeriodEnd: Date
}) {
  const { to, userName, companyName, amount, billingUrl, gracePeriodEnd } = opts

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#ef4444;padding:24px 40px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">⚠️ Payment Failed</h1>
    </div>
    <div style="padding:40px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hi ${userName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">
        We were unable to process the payment of <strong>${amount}</strong> for your <strong>${companyName}</strong> VendorFlow subscription.
      </p>
      <div style="background:#fef2f2;border:1px solid #fee2e2;border-radius:10px;padding:20px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#dc2626;">
          <strong>Your workspace will be suspended on ${gracePeriodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong> 
          unless a valid payment method is added.
        </p>
      </div>
      <a href="${billingUrl}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Update payment method →
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#666;">
        If you believe this is an error, contact us at <a href="mailto:support@vendorflow.com" style="color:#4F46E5;">support@vendorflow.com</a>.
      </p>
    </div>
  </div>
</body>
</html>`

  return sendEmail({
    to,
    subject: `Action required: Payment failed for ${companyName}`,
    html,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Trial ending reminder
// ─────────────────────────────────────────────────────────────────────────────
export async function sendTrialEndingEmail(opts: {
  to: string
  userName: string
  companyName: string
  planName: string
  trialEndsAt: Date
  billingUrl: string
}) {
  const { to, userName, companyName, planName, trialEndsAt, billingUrl } = opts

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Your trial ends in 3 days</h1>
    </div>
    <div style="padding:40px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hi ${userName},</p>
      <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">
        Your free trial of VendorFlow <strong>${planName}</strong> for <strong>${companyName}</strong> ends on 
        <strong>${trialEndsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</strong>.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444;">
        Add a payment method now to ensure your workspace continues without interruption.
      </p>
      <a href="${billingUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Add payment method →
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#888;">
        You won't be charged until your trial ends. Cancel anytime before then.
      </p>
    </div>
  </div>
</body>
</html>`

  return sendEmail({
    to,
    subject: `Your VendorFlow trial ends in 3 days`,
    html,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Welcome email after signup
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(opts: {
  to: string
  userName: string
  dashboardUrl: string
}) {
  const { to, userName, dashboardUrl } = opts

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:40px;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;">Welcome to VendorFlow ⚡</h1>
    </div>
    <div style="padding:40px;">
      <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Hi ${userName},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
        Your account is ready. Here's how to get started in the next 10 minutes:
      </p>
      <ol style="padding-left:20px;margin:0 0 32px;color:#444;font-size:14px;line-height:2.2;">
        <li>Complete your company profile and branding</li>
        <li>Choose your subdomain (e.g., <em>yourcompany.vendorflow.com</em>)</li>
        <li>Invite your first vendor partner</li>
        <li>Watch candidates arrive with AI-generated summaries</li>
      </ol>
      <a href="${dashboardUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Go to dashboard →
      </a>
      <p style="margin:32px 0 0;font-size:13px;color:#888;">
        Need help? Reply to this email or visit our <a href="https://docs.vendorflow.com" style="color:#4F46E5;">documentation</a>.
      </p>
    </div>
    <div style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e8e8e8;">
      <p style="margin:0;font-size:12px;color:#999;text-align:center;">
        VendorFlow · <a href="https://vendorflow.com/legal/privacy" style="color:#999;">Privacy</a> · 
        <a href="https://vendorflow.com/legal/terms" style="color:#999;">Terms</a>
      </p>
    </div>
  </div>
</body>
</html>`

  return sendEmail({ to, subject: "Welcome to VendorFlow — let's get started", html })
}

export { resend }
