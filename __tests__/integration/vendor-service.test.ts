// __tests__/integration/vendor-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { makeUser, makeCompany, makeCompanyMember, makeVendor, makeVendorCompany, makeInvitation } from "../helpers/factories"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

import { auth } from "@/lib/auth"

const mockAdmin = makeUser({ email: "admin@company.com" })
const mockCompany = makeCompany()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: mockAdmin.id,
      email: mockAdmin.email,
      name: mockAdmin.name,
      globalRole: "USER",
    },
  } as any)

  vi.mocked(prisma.companyMember.findFirst).mockResolvedValue(
    makeCompanyMember(mockAdmin.id, mockCompany.id, { role: "COMPANY_ADMIN" }) as any
  )
})

describe("inviteVendor", () => {
  it("creates invitation for valid email", async () => {
    vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null) // No existing invite
    vi.mocked(prisma.invitation.create).mockResolvedValue(
      makeInvitation(mockCompany.id, mockAdmin.id) as any
    )
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const { inviteVendor } = await import("@/services/vendor.service")
    const result = await inviteVendor({
      email: "newvendor@agency.com",
      vendorName: "New Vendor Agency",
      message: "Please join our portal.",
    })

    expect(result.success).toBe(true)
    expect(result.invitationId).toBeDefined()
    expect(prisma.invitation.create).toHaveBeenCalledOnce()
  })

  it("rejects duplicate pending invitation", async () => {
    vi.mocked(prisma.invitation.findFirst).mockResolvedValue(
      makeInvitation(mockCompany.id, mockAdmin.id) as any
    ) // Existing pending invite

    const { inviteVendor } = await import("@/services/vendor.service")
    const result = await inviteVendor({
      email: "existing@vendor.com",
      vendorName: "Existing Vendor",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("already been invited")
  })

  it("rejects when user is not a company admin", async () => {
    vi.mocked(prisma.companyMember.findFirst).mockResolvedValue(
      makeCompanyMember(mockAdmin.id, mockCompany.id, { role: "HIRING_MANAGER" }) as any
    )

    const { inviteVendor } = await import("@/services/vendor.service")
    const result = await inviteVendor({
      email: "vendor@agency.com",
      vendorName: "Test Vendor",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("admin access required")
  })

  it("rejects unauthenticated requests", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const { inviteVendor } = await import("@/services/vendor.service")
    const result = await inviteVendor({
      email: "vendor@agency.com",
      vendorName: "Test Vendor",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unauthorized")
  })

  it("validates email format", async () => {
    const { inviteVendor } = await import("@/services/vendor.service")
    const result = await inviteVendor({
      email: "not-a-valid-email",
      vendorName: "Test Vendor",
    })

    expect(result.success).toBe(false)
  })
})

describe("approveVendor", () => {
  const mockVendor = makeVendor()
  const mockVendorCompany = makeVendorCompany(mockVendor.id, mockCompany.id, { status: "PENDING" })

  it("approves vendor when user is admin", async () => {
    vi.mocked(prisma.companyMember.findUnique).mockResolvedValue(
      makeCompanyMember(mockAdmin.id, mockCompany.id, { role: "COMPANY_ADMIN" }) as any
    )
    vi.mocked(prisma.vendorCompany.update).mockResolvedValue({
      ...mockVendorCompany, status: "APPROVED"
    } as any)
    vi.mocked(prisma.vendorUser.findMany).mockResolvedValue([])
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const { approveVendor } = await import("@/services/vendor.service")
    const result = await approveVendor(mockVendor.id, mockCompany.id)

    expect(result.success).toBe(true)
    expect(prisma.vendorCompany.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "APPROVED" }),
      })
    )
  })

  it("rejects approval from non-admin", async () => {
    vi.mocked(prisma.companyMember.findUnique).mockResolvedValue(
      makeCompanyMember(mockAdmin.id, mockCompany.id, { role: "HIRING_MANAGER" }) as any
    )

    const { approveVendor } = await import("@/services/vendor.service")
    const result = await approveVendor(mockVendor.id, mockCompany.id)

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unauthorized")
  })
})

describe("getInvitationByToken", () => {
  it("returns valid invitation", async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const invitation = makeInvitation(mockCompany.id, mockAdmin.id, {
      expiresAt: futureDate,
      status: "PENDING",
    })

    vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
      ...invitation,
      company: { ...mockCompany, branding: null },
    } as any)

    const { getInvitationByToken } = await import("@/services/vendor.service")
    const result = await getInvitationByToken(invitation.token)

    expect(result).not.toBeNull()
    expect(result?.status).toBe("PENDING")
  })

  it("returns null for expired invitation", async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const expiredInvitation = makeInvitation(mockCompany.id, mockAdmin.id, {
      expiresAt: pastDate,
      status: "PENDING",
    })

    vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
      ...expiredInvitation,
      company: { ...mockCompany, branding: null },
    } as any)
    vi.mocked(prisma.invitation.update).mockResolvedValue({} as any)

    const { getInvitationByToken } = await import("@/services/vendor.service")
    const result = await getInvitationByToken(expiredInvitation.token)

    expect(result).toBeNull()
  })

  it("returns null for non-existent token", async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue(null)

    const { getInvitationByToken } = await import("@/services/vendor.service")
    const result = await getInvitationByToken("fake-token-xyz")

    expect(result).toBeNull()
  })

  it("returns null for already accepted invitation", async () => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
      ...makeInvitation(mockCompany.id, mockAdmin.id, { status: "ACCEPTED" }),
      company: { ...mockCompany, branding: null },
    } as any)

    const { getInvitationByToken } = await import("@/services/vendor.service")
    const result = await getInvitationByToken("accepted-token")

    expect(result).toBeNull()
  })
})
