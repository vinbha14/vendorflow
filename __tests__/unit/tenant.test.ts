// __tests__/unit/tenant.test.ts
import { describe, it, expect } from "vitest"
import { RESERVED_SUBDOMAINS } from "@/types/tenant"
import { generateSlug } from "@/lib/utils"
import { buildTenantUrl } from "@/lib/utils"

describe("Reserved subdomains", () => {
  it("contains critical reserved words", () => {
    const critical = ["www", "app", "api", "admin", "auth", "mail", "support", "billing"]
    for (const word of critical) {
      expect(RESERVED_SUBDOMAINS).toContain(word)
    }
  })

  it("blocks 'vendorflow' as a subdomain", () => {
    expect(RESERVED_SUBDOMAINS).toContain("vendorflow")
  })

  it("blocks 'platform' as a subdomain", () => {
    expect(RESERVED_SUBDOMAINS).toContain("platform")
  })

  it("has no duplicates", () => {
    const unique = new Set(RESERVED_SUBDOMAINS)
    expect(unique.size).toBe(RESERVED_SUBDOMAINS.length)
  })
})

describe("Subdomain slug validation", () => {
  const isValidSubdomain = (slug: string): boolean => {
    return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug) &&
      slug.length >= 3 &&
      slug.length <= 50 &&
      !(RESERVED_SUBDOMAINS as readonly string[]).includes(slug)
  }

  it("accepts valid subdomains", () => {
    expect(isValidSubdomain("techcorp")).toBe(true)
    expect(isValidSubdomain("techcorp-india")).toBe(true)
    expect(isValidSubdomain("my-company-123")).toBe(true)
    expect(isValidSubdomain("abc")).toBe(true)
  })

  it("rejects subdomains starting with hyphen", () => {
    expect(isValidSubdomain("-techcorp")).toBe(false)
  })

  it("rejects subdomains ending with hyphen", () => {
    expect(isValidSubdomain("techcorp-")).toBe(false)
  })

  it("rejects subdomains with uppercase", () => {
    expect(isValidSubdomain("TechCorp")).toBe(false)
  })

  it("rejects subdomains shorter than 3 chars", () => {
    expect(isValidSubdomain("ab")).toBe(false)
  })

  it("rejects reserved subdomains", () => {
    expect(isValidSubdomain("admin")).toBe(false)
    expect(isValidSubdomain("api")).toBe(false)
    expect(isValidSubdomain("www")).toBe(false)
  })

  it("rejects subdomains with special characters", () => {
    expect(isValidSubdomain("tech_corp")).toBe(false)
    expect(isValidSubdomain("tech.corp")).toBe(false)
    expect(isValidSubdomain("tech corp")).toBe(false)
  })
})

describe("Slug generation from company names", () => {
  it("converts company name to valid slug", () => {
    expect(generateSlug("TechCorp India")).toBe("techcorp-india")
  })

  it("handles special characters", () => {
    expect(generateSlug("Acme Corp. (India)")).toBe("acme-corp-india")
  })

  it("handles numbers", () => {
    expect(generateSlug("Company 123")).toBe("company-123")
  })

  it("collapses multiple spaces/hyphens", () => {
    expect(generateSlug("Hello   World")).toBe("hello-world")
  })

  it("produces slugs under 50 chars", () => {
    const long = "Very Long Company Name That Exceeds The Maximum Length For Subdomains"
    expect(generateSlug(long).length).toBeLessThanOrEqual(50)
  })
})

describe("buildTenantUrl", () => {
  it("builds localhost URL in dev", () => {
    process.env["NEXT_PUBLIC_APP_DOMAIN"] = "localhost:3000"
    const url = buildTenantUrl("techcorp")
    expect(url).toBe("http://techcorp.localhost:3000")
  })

  it("builds URL with path", () => {
    process.env["NEXT_PUBLIC_APP_DOMAIN"] = "localhost:3000"
    const url = buildTenantUrl("techcorp", "/dashboard")
    expect(url).toBe("http://techcorp.localhost:3000/dashboard")
  })
})
