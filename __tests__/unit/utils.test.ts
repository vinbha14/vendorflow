// __tests__/unit/utils.test.ts
import { describe, it, expect } from "vitest"
import {
  formatDate,
  formatRelativeDate,
  formatCurrency,
  formatSalaryRange,
  generateSlug,
  truncate,
  getInitials,
  capitalize,
  pluralize,
  formatFileSize,
  isValidEmail,
  isValidUrl,
  isValidHexColor,
  formatNumber,
  clamp,
} from "@/lib/utils"

describe("formatDate", () => {
  it("formats a date in medium format by default", () => {
    const date = new Date("2024-03-15T00:00:00Z")
    const result = formatDate(date, { timezone: "UTC" })
    expect(result).toMatch(/Mar/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2024/)
  })

  it("accepts string dates", () => {
    const result = formatDate("2024-06-01T00:00:00Z", { timezone: "UTC" })
    expect(result).toMatch(/Jun/)
  })

  it("formats in short format", () => {
    const result = formatDate(new Date("2024-03-15T00:00:00Z"), { format: "short", timezone: "UTC" })
    expect(result).toContain("2024")
  })
})

describe("formatRelativeDate", () => {
  it('returns "just now" for recent dates', () => {
    const result = formatRelativeDate(new Date(Date.now() - 30 * 1000))
    expect(result).toBe("just now")
  })

  it("returns minutes for dates within the hour", () => {
    const result = formatRelativeDate(new Date(Date.now() - 5 * 60 * 1000))
    expect(result).toBe("5m ago")
  })

  it("returns hours for dates within the day", () => {
    const result = formatRelativeDate(new Date(Date.now() - 3 * 60 * 60 * 1000))
    expect(result).toBe("3h ago")
  })

  it("returns days for dates within the week", () => {
    const result = formatRelativeDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
    expect(result).toBe("2d ago")
  })
})

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    const result = formatCurrency(1499, "USD")
    expect(result).toBe("$1,499")
  })

  it("formats INR correctly", () => {
    const result = formatCurrency(150000, "INR")
    expect(result).toContain("150,000")
  })

  it("formats large numbers with compact notation for INR", () => {
    const result = formatCurrency(1500000, "INR", { compact: true })
    expect(result).toBe("₹15.0L")
  })

  it("formats crore amounts", () => {
    const result = formatCurrency(15000000, "INR", { compact: true })
    expect(result).toBe("₹1.5Cr")
  })
})

describe("formatSalaryRange", () => {
  it("formats INR salary range in lakhs", () => {
    const result = formatSalaryRange(1500000, 2000000, "INR")
    expect(result).toBe("₹15.0L – ₹20.0L/yr")
  })

  it("formats with only minimum", () => {
    const result = formatSalaryRange(1500000, null, "INR")
    expect(result).toBe("₹15.0L+/yr")
  })

  it("returns not specified when no min", () => {
    const result = formatSalaryRange(null, null, "INR")
    expect(result).toBe("Not specified")
  })

  it("formats USD salary", () => {
    const result = formatSalaryRange(120000, 150000, "USD")
    expect(result).toContain("$120,000")
    expect(result).toContain("$150,000")
  })
})

describe("generateSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(generateSlug("TechCorp India")).toBe("techcorp-india")
  })

  it("removes special characters", () => {
    expect(generateSlug("Acme Corp. (Pvt. Ltd.)")).toBe("acme-corp-pvt-ltd")
  })

  it("collapses multiple hyphens", () => {
    expect(generateSlug("hello---world")).toBe("hello-world")
  })

  it("strips leading and trailing hyphens", () => {
    expect(generateSlug("-test company-")).toBe("test-company")
  })

  it("truncates to 50 characters", () => {
    const long = "a".repeat(60)
    expect(generateSlug(long).length).toBeLessThanOrEqual(50)
  })
})

describe("truncate", () => {
  it("returns the string unchanged if within limit", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world this is long", 10)).toBe("hello w...")
  })
})

describe("getInitials", () => {
  it("extracts first letters of first and last name", () => {
    expect(getInitials("Priya Sharma")).toBe("PS")
  })

  it("handles single name", () => {
    expect(getInitials("Priya")).toBe("P")
  })

  it("limits to 2 characters", () => {
    expect(getInitials("Priya Amita Sharma")).toBe("PA")
  })

  it("handles empty string", () => {
    expect(getInitials("")).toBe("")
  })
})

describe("capitalize", () => {
  it("capitalizes first letter and lowercases rest", () => {
    expect(capitalize("hELLO")).toBe("Hello")
  })

  it("handles empty string", () => {
    expect(capitalize("")).toBe("")
  })
})

describe("pluralize", () => {
  it("returns singular for count of 1", () => {
    expect(pluralize(1, "vendor")).toBe("vendor")
  })

  it("returns plural for count of 0", () => {
    expect(pluralize(0, "vendor")).toBe("vendors")
  })

  it("returns plural for count > 1", () => {
    expect(pluralize(3, "vendor")).toBe("vendors")
  })

  it("uses custom plural", () => {
    expect(pluralize(2, "company", "companies")).toBe("companies")
  })
})

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B")
  })

  it("formats kilobytes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB")
  })

  it("formats megabytes", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB")
  })
})

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true)
    expect(isValidEmail("user+tag@company.co.uk")).toBe(true)
  })

  it("rejects invalid emails", () => {
    expect(isValidEmail("notanemail")).toBe(false)
    expect(isValidEmail("missing@")).toBe(false)
    expect(isValidEmail("@nodomain.com")).toBe(false)
    expect(isValidEmail("")).toBe(false)
  })
})

describe("isValidUrl", () => {
  it("accepts valid URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true)
    expect(isValidUrl("http://localhost:3000")).toBe(true)
  })

  it("rejects invalid URLs", () => {
    expect(isValidUrl("not a url")).toBe(false)
    expect(isValidUrl("example.com")).toBe(false)
  })
})

describe("isValidHexColor", () => {
  it("accepts valid hex colors", () => {
    expect(isValidHexColor("#4F46E5")).toBe(true)
    expect(isValidHexColor("#000000")).toBe(true)
    expect(isValidHexColor("#FFFFFF")).toBe(true)
  })

  it("rejects invalid hex colors", () => {
    expect(isValidHexColor("4F46E5")).toBe(false)  // missing #
    expect(isValidHexColor("#FFF")).toBe(false)     // 3-digit
    expect(isValidHexColor("#GGGGGG")).toBe(false)  // invalid chars
  })
})

describe("formatNumber", () => {
  it("formats thousands", () => {
    expect(formatNumber(1500)).toBe("1.5K")
  })

  it("formats millions", () => {
    expect(formatNumber(2500000)).toBe("2.5M")
  })

  it("returns small numbers as-is", () => {
    expect(formatNumber(999)).toBe("999")
  })
})

describe("clamp", () => {
  it("returns value within range", () => {
    expect(clamp(50, 0, 100)).toBe(50)
  })

  it("clamps to minimum", () => {
    expect(clamp(-10, 0, 100)).toBe(0)
  })

  it("clamps to maximum", () => {
    expect(clamp(150, 0, 100)).toBe(100)
  })
})
