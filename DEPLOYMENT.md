# VendorFlow — Production Deployment Guide

Complete step-by-step guide for deploying VendorFlow to production.
Covers: Supabase · Cloudflare R2 · OpenAI · Resend · Stripe · GitHub · Vercel · Domain setup.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node |
| Git | any | https://git-scm.com |
| psql (optional) | any | for running SQL migrations directly |

---

## Step 1 — Supabase (Database)

### 1.1 Create project
1. Go to https://supabase.com → **New project**
2. Choose organisation, name it `vendorflow-prod`
3. Pick a region close to your users:
   - India: `ap-south-1` (Mumbai)
   - UK/EU: `eu-west-1` (London)
   - US: `us-east-1` (N. Virginia)
4. Set a strong database password — **save it**
5. Wait ~2 minutes for provisioning

### 1.2 Get connection strings
**Settings → Database → Connection string → URI**

Copy two variants:

```
# Pooler / Transaction mode (port 6543) — DATABASE_URL
postgresql://postgres.PROJ:PASS@aws-0-REGION.pooler.supabase.com:6543/postgres

# Direct / Session mode (port 5432) — DIRECT_DATABASE_URL  
postgresql://postgres.PROJ:PASS@aws-0-REGION.pooler.supabase.com:5432/postgres
```

### 1.3 Enable extensions
**SQL Editor → New query** — paste and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## Step 2 — Cloudflare R2 (File Storage)

### 2.1 Create bucket
1. https://dash.cloudflare.com → **R2 Object Storage → Create bucket**
2. Name: `vendorflow-uploads`
3. Choose a region near your users

### 2.2 Enable public access
**Bucket → Settings → Public access → Allow Access**
Copy the **Public bucket URL** → `R2_PUBLIC_URL`

### 2.3 Create API token
**R2 → Manage R2 API tokens → Create API token**
- Permission: **Object Read & Write** on `vendorflow-uploads`
- Copy **Account ID**, **Access Key ID**, **Secret Access Key**

### 2.4 Configure CORS
**Bucket → Settings → CORS** — add this policy:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Step 3 — OpenAI

1. https://platform.openai.com/api-keys → **Create new secret key**
2. Name: `vendorflow-prod`
3. Copy key → `OPENAI_API_KEY`
4. **Billing → Usage limits** → set monthly cap (recommended: $100 to start)

**Cost reference:**
- CV summary (GPT-4o): ~$0.015–0.025 per profile
- Duplicate detection embedding: ~$0.00002 per profile

---

## Step 4 — Resend (Email)

1. https://resend.com → sign up
2. **API Keys → Create API Key** → copy → `RESEND_API_KEY`
3. **Domains → Add Domain** → add your sending domain
4. Follow the DNS verification steps (SPF, DKIM, DMARC records)
5. Once verified: set `RESEND_FROM_EMAIL=noreply@yourdomain.com`

> Free tier: 3,000 emails/month. Sufficient for early-stage use.

---

## Step 5 — Stripe (Billing)

### 5.1 Account setup
1. https://stripe.com → Create account
2. Complete business verification for live payments
3. Toggle between **Test mode** and **Live mode** in the top-right

### 5.2 Create products and prices

In **Products → Add product**, create these three products:

| Product | Monthly | Annual |
|---|---|---|
| VendorFlow Starter | $49/month | $470/year |
| VendorFlow Growth | $149/month | $1,430/year |
| VendorFlow Scale | $349/month | $3,350/year |

For each, click **Add another price** to create both monthly and annual variants.
Copy each **Price ID** (starts with `price_`) into your env variables.

### 5.3 Get API keys
**Developers → API keys**
- Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Secret key → `STRIPE_SECRET_KEY`

### 5.4 Create webhook endpoint
**Developers → Webhooks → Add endpoint**

- **URL**: `https://yourdomain.com/api/webhooks/stripe`
- **Events** (select all seven):
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.trial_will_end`

Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 5.5 Configure Customer Portal
**Settings → Billing → Customer portal**

Enable:
- ✅ Customers can update subscriptions
- ✅ Customers can cancel subscriptions
- ✅ Customers can update payment methods

Click **Save**.

### 5.6 Test webhooks locally
```bash
npm install -g @stripe/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# In another terminal:
stripe trigger checkout.session.completed
```

---

## Step 6 — Push to GitHub

```bash
cd vendorflow

git init
git add .
git commit -m "Initial VendorFlow commit"

# Create a new PRIVATE repository on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/vendorflow.git
git branch -M main
git push -u origin main
```

---

## Step 7 — Deploy to Vercel

### 7.1 Import project
1. https://vercel.com → **Add New → Project**
2. **Import** your `vendorflow` repository
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: leave blank
5. **Do not click Deploy yet** — add env vars first

### 7.2 Add environment variables
**Project → Settings → Environment Variables**

Add every variable from `.env.example` with your real values.
Set all variables to apply to: **Production + Preview + Development**.

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database (port 6543) |
| `DIRECT_DATABASE_URL` | Supabase → Settings → Database (port 5432) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://yourdomain.com` |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | dashboard.stripe.com → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → your endpoint |
| `STRIPE_*_PRICE_ID` | Stripe → Products → each price |
| `RESEND_API_KEY` | resend.com → API keys |
| `R2_*` | Cloudflare → R2 → your bucket |
| `TRIGGER_API_KEY` | trigger.dev → API keys |

### 7.3 Deploy
Click **Deploy**. First build takes 3–5 minutes.

### 7.4 Future deployments
Every `git push` to `main` triggers automatic redeployment. Zero downtime.

---

## Step 8 — Run Database Migrations

Run these **once** after your first successful deploy, from your local machine:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Step 8a — Run Prisma schema migrations (creates all tables)
DATABASE_URL="your-DIRECT-supabase-url" \
DIRECT_DATABASE_URL="your-DIRECT-supabase-url" \
npx prisma migrate deploy

# Step 8b — Run pgvector migration (enables vector extension + similarity function)
psql "your-DIRECT-supabase-url" \
  -f prisma/migrations/add_pgvector/migration.sql

# Step 8c — Run AI summary structured fields migration
psql "your-DIRECT-supabase-url" \
  -f prisma/migrations/add_ai_summary_structured_fields/migration.sql

# Step 8d — Run duplicate scoring fields migration
psql "your-DIRECT-supabase-url" \
  -f prisma/migrations/add_duplicate_scoring_fields/migration.sql

# Step 8e — Seed: creates plans, super admin, demo companies, vendors, candidates
DATABASE_URL="your-DIRECT-supabase-url" npm run db:seed
```

**Alternative (no psql installed):** paste migration SQL files into
Supabase **SQL Editor → New query → Run**.

### Seed accounts (change passwords immediately after first login)

| Role | Email | Password | Redirects to |
|---|---|---|---|
| Super Admin | `admin@vendorflow.com` | `Admin@123456` | `/admin` |
| Company Admin | `priya@techcorpindia.com` | `Demo@123456` | `/dashboard` |
| Hiring Manager | `arjun@techcorpindia.com` | `Demo@123456` | `/dashboard` |
| Vendor Admin | `ravi@talentbridge.in` | `Vendor@123456` | `/vendor` |

---

## Step 9 — Domain & Subdomain Setup

### 9.1 Add domains in Vercel
**Project → Settings → Domains → Add**

Add all three:
- `yourdomain.com`
- `www.yourdomain.com`
- `*.yourdomain.com` ← **wildcard — required for tenant subdomains**

### 9.2 Configure DNS records
In your domain registrar (GoDaddy, Namecheap, Cloudflare DNS, etc.):

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` (check Vercel for current IP) |
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `CNAME` | `*` | `cname.vercel-dns.com` |

> **Wildcard CNAME support:** Not all registrars support wildcard CNAMEs.
> If yours doesn't, point your nameservers to **Cloudflare DNS** (free) and add
> the records there — Cloudflare supports wildcards on all plans.

### 9.3 Update environment variables
After DNS is set up, update these in Vercel:

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_DOMAIN=yourdomain.com
AUTH_URL=https://yourdomain.com
```

Then redeploy: **Vercel → Deployments → ··· → Redeploy**

### 9.4 How subdomains work
When a user visits `techcorp-india.yourdomain.com`:
1. Wildcard DNS routes to Vercel
2. Next.js middleware extracts slug `techcorp-india` from the hostname
3. Sets `x-tenant-slug` header on the request
4. Server components call `getTenantFromHeaders()` → loads company data
5. Company's logo, colors, and branding are applied

### 9.5 Test locally (no DNS required)
Add to `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1  techcorp-india.localhost
127.0.0.1  globalhire.localhost
```
Then visit `http://techcorp-india.localhost:3000`

---

## Step 10 — Trigger.dev (Background AI Jobs)

Background jobs prevent AI summarization from blocking the HTTP request.

```bash
# Install Trigger.dev CLI
npm install -g @trigger.dev/cli

# Initialise in your project (creates trigger.config.ts)
npx trigger.dev@latest init

# Add TRIGGER_API_KEY to Vercel env vars, then deploy jobs:
npx trigger.dev@latest deploy
```

**Without Trigger.dev:** The service is wired to run synchronously as a fallback.
Summaries will generate during the submission request (~5–10s), but users will
see a loading state. Fine for early-stage.

---

## Step 11 — Post-Deploy Verification

Work through every item after each fresh deployment:

### Auth
- [ ] `/` homepage loads
- [ ] `/auth/sign-up` — create a new account → redirected to onboarding
- [ ] `/auth/sign-in` as `admin@vendorflow.com` → redirected to `/admin`
- [ ] `/auth/sign-in` as `priya@techcorpindia.com` → redirected to `/dashboard`
- [ ] `/auth/sign-in` as `ravi@talentbridge.in` → redirected to `/vendor`

### Subdomains
- [ ] `https://techcorp-india.yourdomain.com` → shows TechCorp India branded portal
- [ ] `https://globalhire.yourdomain.com` → shows GlobalHire Corp branded portal

### File upload
- [ ] Go to vendor → Submit candidate → Upload a PDF CV
- [ ] File appears in Cloudflare R2 bucket

### Stripe
- [ ] `/onboarding/billing` → click Start Trial → Stripe Checkout appears
- [ ] Complete with test card `4242 4242 4242 4242` / `12/34` / `123`
- [ ] Redirect back to `/dashboard`
- [ ] Webhook received in Stripe → Webhooks → Recent deliveries

### Email
- [ ] Invite a vendor → check Resend dashboard for delivery
- [ ] Email links work

### AI
- [ ] Submit candidate with a CV
- [ ] After 10–30s: AI summary card appears with recommendation badge
- [ ] Submit same candidate again → duplicate alert fires

---

## Step 12 — Production Launch Checklist

### Security
- [ ] `AUTH_SECRET` is a real random 32-char string (not the placeholder)
- [ ] All `.env.local` files are in `.gitignore` — never committed
- [ ] Stripe switched from **Test** → **Live** mode
  - Update `STRIPE_SECRET_KEY` to `sk_live_...`
  - Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
  - Create new webhook endpoint for live mode → new `STRIPE_WEBHOOK_SECRET`
- [ ] Super admin password changed from `Admin@123456`
- [ ] Demo accounts removed or passwords rotated
- [ ] R2 CORS restricted to your production domain
- [ ] OpenAI monthly spend limit set

### Business
- [ ] Privacy Policy page has real legal content (replace placeholder)
- [ ] Terms of Service page has real legal content (replace placeholder)
- [ ] Billing plans match your intended pricing
- [ ] Test a real card purchase end-to-end (not test card)
- [ ] Support email is monitored
- [ ] Stripe Customer Portal is configured

### Performance
- [ ] `npm run build` passes with zero errors locally
- [ ] `npm run typecheck` passes with zero errors
- [ ] Vercel build logs show no warnings

### Monitoring
- [ ] Vercel deployment notifications enabled
- [ ] Stripe payment failure alerts enabled (Settings → Notifications)
- [ ] OpenAI usage alerts configured (platform.openai.com → Limits)
- [ ] Supabase database size monitored (upgrade free tier at 400MB)

### Tests
- [ ] `npm run test` — all unit and integration tests pass
- [ ] `npm run test:e2e` — all Playwright E2E tests pass
- [ ] Full manual smoke test (sign up → onboard → invite vendor → submit CV → review AI summary → shortlist)

---

## Ongoing Operations

### Deploy a code change
```bash
git add .
git commit -m "describe your change"
git push origin main
# Vercel auto-deploys — ~2 minutes
```

### Roll back a bad deployment
Vercel → Deployments → find last good deploy → ··· → **Promote to Production**

### Run a database migration in production
```bash
# Always use DIRECT_DATABASE_URL for migrations
DATABASE_URL="your-direct-supabase-url" npx prisma migrate deploy
```

### Monitor costs
- **AI**: platform.openai.com → Usage → set monthly alert
- **Database**: Supabase dashboard → Database size
- **Storage**: Cloudflare R2 → Usage
- **Email**: Resend dashboard → Usage

### Scale thresholds
| Trigger | Action |
|---|---|
| >400MB database | Upgrade Supabase to Pro ($25/mo) |
| >10GB R2 storage | Stays free (R2 is $0.015/GB after 10GB) |
| >3,000 emails/month | Upgrade Resend ($20/mo for 50K) |
| >100 concurrent users | Add Redis cache (Upstash, Vercel-native) |
| >500 companies | Move to dedicated PostgreSQL (Railway, Neon, RDS) |

---

## Troubleshooting

### "PrismaClientInitializationError"
`DATABASE_URL` is wrong or pointing to the wrong port. The runtime URL must use port 6543 (pooler). The migration URL must use port 5432 (direct).

### "AUTH_SECRET is not set"
Generate and set in Vercel: `openssl rand -base64 32`

### Subdomains return 404
1. Check wildcard DNS `*.yourdomain.com` is set
2. Check Vercel → Settings → Domains shows `*.yourdomain.com`
3. DNS propagation can take up to 48 hours — check at https://dnschecker.org

### Stripe webhook "Invalid signature"
- `STRIPE_WEBHOOK_SECRET` must match the signing secret from Stripe → your specific webhook endpoint
- The URL must exactly match what's registered in Stripe
- For live mode, create a separate webhook endpoint (test and live webhooks have separate secrets)

### Emails go to spam
Your sending domain is not verified in Resend, or SPF/DKIM records are missing. Check Resend → Domains → verify all DNS records are green.

### AI summaries not appearing
1. Check Trigger.dev dashboard for job failures
2. Verify `OPENAI_API_KEY` in Vercel environment variables
3. Check OpenAI usage dashboard for quota exceeded
4. Check Vercel function logs: Vercel → Project → Logs

### File uploads failing
1. Check R2 CORS configuration
2. Verify `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` match your R2 API token
3. Verify `R2_BUCKET_NAME` exactly matches your bucket name (case-sensitive)

---

*Questions? support@vendorflow.com*
