// =============================================================================
// VendorFlow — Database Seed
// Creates realistic demo data for development and investor demos
// Run with: npm run db:seed
// =============================================================================

import { PrismaClient, UserGlobalRole, CompanyMemberRole, CompanyStatus, VendorStatus, VendorCompanyStatus, CandidateSubmissionStatus, SubscriptionStatus, BillingCycle, InvitationType, InvitationStatus, VendorDocumentType, AiSummaryStatus, DuplicateAlertSeverity, DuplicateAlertStatus, DuplicateReviewDecision, EmploymentType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting VendorFlow seed...\n");

  // =========================================================================
  // PLANS
  // =========================================================================
  console.log("📦 Seeding plans...");

  const starterPlan = await prisma.plan.upsert({
    where: { name: "starter" },
    update: {},
    create: {
      name: "starter",
      displayName: "Starter",
      description: "Perfect for small teams getting started with vendor management",
      maxVendors: 10,
      maxTeamMembers: 3,
      hasAiSummaries: true,
      hasDuplicateDetection: true,
      hasCustomBranding: true,
      hasApiAccess: false,
      hasPrioritySupport: false,
      hasAuditLogs: false,
      hasSso: false,
      monthlyPrice: 49,
      annualPrice: 470,
      currency: "USD",
      stripePriceIdMonthly: process.env["STRIPE_STARTER_MONTHLY_PRICE_ID"] || "price_starter_monthly_placeholder",
      stripePriceIdAnnual: process.env["STRIPE_STARTER_ANNUAL_PRICE_ID"] || "price_starter_annual_placeholder",
      sortOrder: 1,
      isActive: true,
      isFeatured: false,
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { name: "growth" },
    update: {},
    create: {
      name: "growth",
      displayName: "Growth",
      description: "For growing teams managing multiple vendors at scale",
      maxVendors: 50,
      maxTeamMembers: 10,
      hasAiSummaries: true,
      hasDuplicateDetection: true,
      hasCustomBranding: true,
      hasApiAccess: true,
      hasPrioritySupport: false,
      hasAuditLogs: true,
      hasSso: false,
      monthlyPrice: 149,
      annualPrice: 1430,
      currency: "USD",
      stripePriceIdMonthly: process.env["STRIPE_GROWTH_MONTHLY_PRICE_ID"] || "price_growth_monthly_placeholder",
      stripePriceIdAnnual: process.env["STRIPE_GROWTH_ANNUAL_PRICE_ID"] || "price_growth_annual_placeholder",
      sortOrder: 2,
      isActive: true,
      isFeatured: true,
      badgeText: "Most Popular",
    },
  });

  const scalePlan = await prisma.plan.upsert({
    where: { name: "scale" },
    update: {},
    create: {
      name: "scale",
      displayName: "Scale",
      description: "Enterprise-grade for large organizations with complex requirements",
      maxVendors: 200,
      maxTeamMembers: 50,
      hasAiSummaries: true,
      hasDuplicateDetection: true,
      hasCustomBranding: true,
      hasApiAccess: true,
      hasPrioritySupport: true,
      hasAuditLogs: true,
      hasSso: true,
      monthlyPrice: 349,
      annualPrice: 3350,
      currency: "USD",
      stripePriceIdMonthly: process.env["STRIPE_SCALE_MONTHLY_PRICE_ID"] || "price_scale_monthly_placeholder",
      stripePriceIdAnnual: process.env["STRIPE_SCALE_ANNUAL_PRICE_ID"] || "price_scale_annual_placeholder",
      sortOrder: 3,
      isActive: true,
      isFeatured: false,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: "enterprise" },
    update: {},
    create: {
      name: "enterprise",
      displayName: "Enterprise",
      description: "Custom solutions for large enterprises. Contact us for pricing.",
      maxVendors: -1, // unlimited
      maxTeamMembers: -1,
      hasAiSummaries: true,
      hasDuplicateDetection: true,
      hasCustomBranding: true,
      hasApiAccess: true,
      hasPrioritySupport: true,
      hasAuditLogs: true,
      hasSso: true,
      monthlyPrice: 0, // Custom
      annualPrice: 0,
      currency: "USD",
      sortOrder: 4,
      isActive: true,
      isFeatured: false,
    },
  });

  console.log(`   ✓ Created ${4} plans\n`);

  // =========================================================================
  // SUPER ADMIN USER
  // =========================================================================
  console.log("👑 Seeding super admin...");

  const hashedPassword = await bcrypt.hash("Admin@123456", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@vendorflow.com" },
    update: {},
    create: {
      email: "admin@vendorflow.com",
      name: "Platform Admin",
      hashedPassword,
      emailVerified: new Date(),
      globalRole: UserGlobalRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log(`   ✓ Super admin: admin@vendorflow.com / Admin@123456\n`);

  // =========================================================================
  // DEMO COMPANY 1: TechCorp India (Large company on Growth plan)
  // =========================================================================
  console.log("🏢 Seeding demo companies...");

  const techcorpCompany = await prisma.company.upsert({
    where: { slug: "techcorp-india" },
    update: {},
    create: {
      name: "TechCorp India",
      slug: "techcorp-india",
      subdomain: "techcorp-india",
      logoUrl: null,
      website: "https://techcorpindia.com",
      legalName: "TechCorp India Private Limited",
      taxId: "29AABCT1332L1Z8",
      country: "IN",
      state: "Karnataka",
      city: "Bangalore",
      address: "12th Floor, Brigade Gateway, Rajajinagar",
      postalCode: "560010",
      currency: "INR",
      timezone: "Asia/Kolkata",
      industry: "Technology",
      size: "201-500",
      status: CompanyStatus.ACTIVE,
    },
  });

  // Branding for TechCorp
  await prisma.companyBranding.upsert({
    where: { companyId: techcorpCompany.id },
    update: {},
    create: {
      companyId: techcorpCompany.id,
      primaryColor: "#4F46E5",
      secondaryColor: "#818CF8",
      accentColor: "#C7D2FE",
      tagline: "Building the future of technology, together",
      description:
        "TechCorp India is a leading technology solutions company headquartered in Bangalore. We partner with top vendor agencies to bring the best engineering talent to our teams. Our collaborative approach ensures mutual growth for our vendors and exceptional outcomes for our customers.",
      supportEmail: "vendors@techcorpindia.com",
      openOpportunities: [
        {
          title: "Senior React Developer",
          location: "Bangalore / Remote",
          type: "Full-time",
          skills: ["React", "TypeScript", "Node.js"],
        },
        {
          title: "DevOps Engineer",
          location: "Bangalore",
          type: "Contract",
          skills: ["Kubernetes", "AWS", "Terraform"],
        },
        {
          title: "Data Scientist",
          location: "Remote",
          type: "Full-time",
          skills: ["Python", "ML", "SQL"],
        },
      ],
    },
  });

  // Company admin for TechCorp
  const techcorpAdminPassword = await bcrypt.hash("Demo@123456", 12);
  const techcorpAdmin = await prisma.user.upsert({
    where: { email: "priya@techcorpindia.com" },
    update: {},
    create: {
      email: "priya@techcorpindia.com",
      name: "Priya Sharma",
      hashedPassword: techcorpAdminPassword,
      emailVerified: new Date(),
      globalRole: UserGlobalRole.USER,
      isActive: true,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: techcorpAdmin.id, companyId: techcorpCompany.id } },
    update: {},
    create: {
      userId: techcorpAdmin.id,
      companyId: techcorpCompany.id,
      role: CompanyMemberRole.COMPANY_ADMIN,
      isActive: true,
    },
  });

  // Hiring manager for TechCorp
  const hiringManagerPassword = await bcrypt.hash("Demo@123456", 12);
  const techcorpHM = await prisma.user.upsert({
    where: { email: "arjun@techcorpindia.com" },
    update: {},
    create: {
      email: "arjun@techcorpindia.com",
      name: "Arjun Mehta",
      hashedPassword: hiringManagerPassword,
      emailVerified: new Date(),
      globalRole: UserGlobalRole.USER,
      isActive: true,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: techcorpHM.id, companyId: techcorpCompany.id } },
    update: {},
    create: {
      userId: techcorpHM.id,
      companyId: techcorpCompany.id,
      role: CompanyMemberRole.HIRING_MANAGER,
      isActive: true,
    },
  });

  // Subscription for TechCorp
  await prisma.subscription.upsert({
    where: { companyId: techcorpCompany.id },
    update: {},
    create: {
      companyId: techcorpCompany.id,
      planId: growthPlan.id,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      stripeCustomerId: "cus_demo_techcorp",
      stripeSubscriptionId: "sub_demo_techcorp",
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      activeVendorCount: 8,
    },
  });

  // =========================================================================
  // DEMO COMPANY 2: GlobalHire Corp (International company on Scale plan)
  // =========================================================================

  const globalhireCompany = await prisma.company.upsert({
    where: { slug: "globalhire" },
    update: {},
    create: {
      name: "GlobalHire Corp",
      slug: "globalhire",
      subdomain: "globalhire",
      website: "https://globalhire.io",
      legalName: "GlobalHire Corporation Ltd",
      taxId: "GB123456789",
      country: "GB",
      state: "England",
      city: "London",
      address: "1 Canada Square, Canary Wharf",
      postalCode: "E14 5AB",
      currency: "GBP",
      timezone: "Europe/London",
      industry: "Financial Services",
      size: "501-1000",
      status: CompanyStatus.ACTIVE,
    },
  });

  await prisma.companyBranding.upsert({
    where: { companyId: globalhireCompany.id },
    update: {},
    create: {
      companyId: globalhireCompany.id,
      primaryColor: "#0F172A",
      secondaryColor: "#1E3A5F",
      accentColor: "#3B82F6",
      tagline: "Global talent for global teams",
      description:
        "GlobalHire Corp connects world-class financial services firms with elite technology talent across Europe and Asia. We maintain the highest standards for our vendor partnerships.",
      supportEmail: "vendors@globalhire.io",
      openOpportunities: [
        {
          title: "Quantitative Analyst",
          location: "London",
          type: "Full-time",
          skills: ["Python", "R", "Financial Modelling"],
        },
        {
          title: "Java Backend Engineer",
          location: "Remote (EU)",
          type: "Contract",
          skills: ["Java", "Spring Boot", "Kafka"],
        },
      ],
    },
  });

  const globalhireAdminPassword = await bcrypt.hash("Demo@123456", 12);
  const globalhireAdmin = await prisma.user.upsert({
    where: { email: "sarah@globalhire.io" },
    update: {},
    create: {
      email: "sarah@globalhire.io",
      name: "Sarah Chen",
      hashedPassword: globalhireAdminPassword,
      emailVerified: new Date(),
      globalRole: UserGlobalRole.USER,
      isActive: true,
    },
  });

  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: globalhireAdmin.id, companyId: globalhireCompany.id } },
    update: {},
    create: {
      userId: globalhireAdmin.id,
      companyId: globalhireCompany.id,
      role: CompanyMemberRole.COMPANY_ADMIN,
      isActive: true,
    },
  });

  await prisma.subscription.upsert({
    where: { companyId: globalhireCompany.id },
    update: {},
    create: {
      companyId: globalhireCompany.id,
      planId: scalePlan.id,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.ANNUAL,
      stripeCustomerId: "cus_demo_globalhire",
      stripeSubscriptionId: "sub_demo_globalhire",
      currentPeriodStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
      activeVendorCount: 23,
    },
  });

  console.log(`   ✓ Created TechCorp India (techcorp-india.vendorflow.com)`);
  console.log(`   ✓ Created GlobalHire Corp (globalhire.vendorflow.com)\n`);

  // =========================================================================
  // VENDORS
  // =========================================================================
  console.log("🤝 Seeding vendors...");

  const vendorPassword = await bcrypt.hash("Vendor@123456", 12);

  // Vendor 1: TalentBridge India
  const talentbridgeVendor = await prisma.vendor.upsert({
    where: { email: "contact@talentbridge.in" },
    update: {},
    create: {
      name: "TalentBridge India",
      email: "contact@talentbridge.in",
      phone: "+91 80 4567 8901",
      website: "https://talentbridge.in",
      legalName: "TalentBridge Staffing Solutions Pvt Ltd",
      taxId: "29AAACT5438L1Z1",
      country: "IN",
      city: "Bangalore",
      serviceCategories: ["Software Engineering", "DevOps", "Data Science"],
      geographicCoverage: ["Bangalore", "Hyderabad", "Pune", "Chennai"],
      domainExpertise: ["FinTech", "E-Commerce", "SaaS"],
      description: "Leading IT staffing firm with 12+ years of experience placing senior engineers across India's top tech companies.",
      status: VendorStatus.APPROVED,
      overallRating: 4.7,
      totalSubmissions: 142,
    },
  });

  // Vendor admin user for TalentBridge
  const vendorAdmin1 = await prisma.user.upsert({
    where: { email: "ravi@talentbridge.in" },
    update: {},
    create: {
      email: "ravi@talentbridge.in",
      name: "Ravi Kumar",
      hashedPassword: vendorPassword,
      emailVerified: new Date(),
      globalRole: UserGlobalRole.USER,
      isActive: true,
    },
  });

  await prisma.vendorUser.upsert({
    where: { userId_vendorId: { userId: vendorAdmin1.id, vendorId: talentbridgeVendor.id } },
    update: {},
    create: {
      userId: vendorAdmin1.id,
      vendorId: talentbridgeVendor.id,
      role: "ADMIN",
      isActive: true,
    },
  });

  // Vendor recruiter
  const vendorRecruiter1 = await prisma.user.upsert({
    where: { email: "neha@talentbridge.in" },
    update: {},
    create: {
      email: "neha@talentbridge.in",
      name: "Neha Patel",
      hashedPassword: vendorPassword,
      emailVerified: new Date(),
      globalRole: UserGlobalRole.USER,
      isActive: true,
    },
  });

  await prisma.vendorUser.upsert({
    where: { userId_vendorId: { userId: vendorRecruiter1.id, vendorId: talentbridgeVendor.id } },
    update: {},
    create: {
      userId: vendorRecruiter1.id,
      vendorId: talentbridgeVendor.id,
      role: "RECRUITER",
      isActive: true,
    },
  });

  // Vendor 2: CodeForce Staffing
  const codeforceVendor = await prisma.vendor.upsert({
    where: { email: "hello@codeforce.io" },
    update: {},
    create: {
      name: "CodeForce Staffing",
      email: "hello@codeforce.io",
      phone: "+91 22 6789 0123",
      website: "https://codeforce.io",
      country: "IN",
      city: "Mumbai",
      serviceCategories: ["Frontend Development", "Mobile Development", "QA Testing"],
      geographicCoverage: ["Mumbai", "Delhi", "Bangalore"],
      domainExpertise: ["Banking", "Insurance", "Retail"],
      description: "Specialist tech recruitment firm focused on frontend and mobile talent across India.",
      status: VendorStatus.APPROVED,
      overallRating: 4.3,
      totalSubmissions: 87,
    },
  });

  const vendorAdmin2 = await prisma.user.upsert({
    where: { email: "vikram@codeforce.io" },
    update: {},
    create: {
      email: "vikram@codeforce.io",
      name: "Vikram Singh",
      hashedPassword: vendorPassword,
      emailVerified: new Date(),
      globalRole: UserGlobalRole.USER,
      isActive: true,
    },
  });

  await prisma.vendorUser.upsert({
    where: { userId_vendorId: { userId: vendorAdmin2.id, vendorId: codeforceVendor.id } },
    update: {},
    create: {
      userId: vendorAdmin2.id,
      vendorId: codeforceVendor.id,
      role: "ADMIN",
      isActive: true,
    },
  });

  // Vendor 3: Global Tech Recruit (pending approval)
  const globaltechVendor = await prisma.vendor.upsert({
    where: { email: "contact@globaltech-recruit.com" },
    update: {},
    create: {
      name: "Global Tech Recruit",
      email: "contact@globaltech-recruit.com",
      phone: "+44 20 7946 0123",
      website: "https://globaltech-recruit.com",
      country: "GB",
      city: "London",
      serviceCategories: ["Software Engineering", "Architecture", "Cloud"],
      geographicCoverage: ["UK", "Europe", "India"],
      domainExpertise: ["FinTech", "Banking", "InsureTech"],
      description: "UK-based technical recruitment firm specializing in senior and lead engineering roles.",
      status: VendorStatus.PENDING,
      overallRating: null,
      totalSubmissions: 0,
    },
  });

  console.log(`   ✓ Created 3 vendors (TalentBridge, CodeForce, Global Tech Recruit)\n`);

  // =========================================================================
  // VENDOR-COMPANY RELATIONSHIPS
  // =========================================================================
  console.log("🔗 Seeding vendor-company relationships...");

  // TalentBridge <-> TechCorp (Approved)
  await prisma.vendorCompany.upsert({
    where: { vendorId_companyId: { vendorId: talentbridgeVendor.id, companyId: techcorpCompany.id } },
    update: {},
    create: {
      vendorId: talentbridgeVendor.id,
      companyId: techcorpCompany.id,
      status: VendorCompanyStatus.APPROVED,
      approvedBy: techcorpAdmin.id,
      approvedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      rating: 4.8,
      submissionsCount: 24,
      acceptedCount: 8,
    },
  });

  // CodeForce <-> TechCorp (Approved)
  await prisma.vendorCompany.upsert({
    where: { vendorId_companyId: { vendorId: codeforceVendor.id, companyId: techcorpCompany.id } },
    update: {},
    create: {
      vendorId: codeforceVendor.id,
      companyId: techcorpCompany.id,
      status: VendorCompanyStatus.APPROVED,
      approvedBy: techcorpAdmin.id,
      approvedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      rating: 4.2,
      submissionsCount: 15,
      acceptedCount: 4,
    },
  });

  // GlobalTech <-> TechCorp (Pending)
  await prisma.vendorCompany.upsert({
    where: { vendorId_companyId: { vendorId: globaltechVendor.id, companyId: techcorpCompany.id } },
    update: {},
    create: {
      vendorId: globaltechVendor.id,
      companyId: techcorpCompany.id,
      status: VendorCompanyStatus.PENDING,
    },
  });

  // TalentBridge <-> GlobalHire (Approved)
  await prisma.vendorCompany.upsert({
    where: { vendorId_companyId: { vendorId: talentbridgeVendor.id, companyId: globalhireCompany.id } },
    update: {},
    create: {
      vendorId: talentbridgeVendor.id,
      companyId: globalhireCompany.id,
      status: VendorCompanyStatus.APPROVED,
      approvedBy: globalhireAdmin.id,
      approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      rating: 4.5,
      submissionsCount: 12,
      acceptedCount: 5,
    },
  });

  console.log(`   ✓ Created 4 vendor-company relationships\n`);

  // =========================================================================
  // CANDIDATE PROFILES
  // =========================================================================
  console.log("👤 Seeding candidate profiles...");

  const candidates = [
    {
      vendorId: talentbridgeVendor.id,
      fullName: "Amit Kapoor",
      email: "amit.kapoor@gmail.com",
      phone: "+91 98765 43210",
      currentTitle: "Senior React Developer",
      currentCompany: "Infosys",
      experienceYears: 6,
      location: "Bangalore",
      country: "IN",
      skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
      domainExpertise: ["E-Commerce", "SaaS"],
      noticePeriodDays: 30,
      employmentType: EmploymentType.FULL_TIME,
      expectedSalaryMin: 1800000,
      expectedSalaryMax: 2200000,
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
      workAuthorization: "Indian Citizen",
      highestDegree: "B.Tech Computer Science",
      university: "IIT Bombay",
      graduationYear: 2018,
      linkedinUrl: "https://linkedin.com/in/amitkapoor",
      resumeText: "Senior React developer with 6 years of experience building scalable web applications. Led frontend architecture for 3 major e-commerce platforms serving 1M+ users. Expert in TypeScript, React hooks, and modern state management. Strong background in performance optimization and accessibility. Led team of 8 engineers at Infosys. B.Tech from IIT Bombay.",
    },
    {
      vendorId: talentbridgeVendor.id,
      fullName: "Deepika Nair",
      email: "deepika.nair@outlook.com",
      phone: "+91 87654 32109",
      currentTitle: "DevOps Engineer",
      currentCompany: "Wipro",
      experienceYears: 5,
      location: "Hyderabad",
      country: "IN",
      skills: ["Kubernetes", "AWS", "Terraform", "Jenkins", "Docker", "Python"],
      domainExpertise: ["FinTech", "Banking"],
      noticePeriodDays: 45,
      employmentType: EmploymentType.FULL_TIME,
      expectedSalaryMin: 1500000,
      expectedSalaryMax: 1900000,
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
      workAuthorization: "Indian Citizen",
      highestDegree: "M.Tech Cloud Computing",
      university: "BITS Pilani",
      graduationYear: 2019,
      resumeText: "Experienced DevOps engineer with deep expertise in Kubernetes orchestration and AWS infrastructure. Designed and implemented CI/CD pipelines for 15+ microservices. Reduced deployment time by 70% through automation. AWS Solutions Architect certified. 5 years at Wipro working on FinTech projects.",
    },
    {
      vendorId: codeforceVendor.id,
      fullName: "Rohan Gupta",
      email: "rohan.gupta@gmail.com",
      phone: "+91 76543 21098",
      currentTitle: "Full Stack Developer",
      currentCompany: "TCS",
      experienceYears: 4,
      location: "Mumbai",
      country: "IN",
      skills: ["React", "Node.js", "MongoDB", "Express", "TypeScript"],
      domainExpertise: ["Banking", "Insurance"],
      noticePeriodDays: 60,
      employmentType: EmploymentType.FULL_TIME,
      expectedSalaryMin: 1200000,
      expectedSalaryMax: 1600000,
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
      workAuthorization: "Indian Citizen",
      highestDegree: "B.E. Information Technology",
      university: "Mumbai University",
      graduationYear: 2020,
      resumeText: "Full-stack developer at TCS with 4 years experience in React/Node.js stack. Delivered 8 client projects in banking domain. Built REST APIs serving 500K daily requests. Strong understanding of financial compliance requirements.",
    },
    {
      vendorId: talentbridgeVendor.id,
      fullName: "Priyanka Rao",
      email: "priyanka.rao@yahoo.com",
      phone: "+91 95432 10987",
      currentTitle: "Data Scientist",
      currentCompany: "Amazon",
      experienceYears: 7,
      location: "Bangalore",
      country: "IN",
      skills: ["Python", "TensorFlow", "PyTorch", "SQL", "Spark", "ML", "NLP"],
      domainExpertise: ["E-Commerce", "Retail", "AdTech"],
      noticePeriodDays: 90,
      employmentType: EmploymentType.FULL_TIME,
      expectedSalaryMin: 2800000,
      expectedSalaryMax: 3500000,
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
      workAuthorization: "Indian Citizen",
      highestDegree: "M.S. Machine Learning",
      university: "IISc Bangalore",
      graduationYear: 2017,
      linkedinUrl: "https://linkedin.com/in/priyankarao",
      resumeText: "Senior Data Scientist at Amazon with 7 years experience building production ML systems. Led development of recommendation engine serving 100M+ users. Published 3 papers on NLP. Expert in Python, TensorFlow, and large-scale data processing with Spark. IISc alumna.",
    },
    // Potential duplicate of candidate 1 (Amit Kapoor) — different phone, similar email
    {
      vendorId: codeforceVendor.id,
      fullName: "Amit Kumar Kapoor",
      email: "amitkapoor89@gmail.com",
      phone: "+91 98765 43211",
      currentTitle: "React Developer",
      currentCompany: "Infosys Limited",
      experienceYears: 6,
      location: "Bengaluru",
      country: "IN",
      skills: ["React", "JavaScript", "TypeScript", "Node.js", "REST APIs"],
      domainExpertise: ["SaaS", "E-Commerce"],
      noticePeriodDays: 30,
      employmentType: EmploymentType.FULL_TIME,
      expectedSalaryMin: 1900000,
      expectedSalaryMax: 2300000,
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
      workAuthorization: "Indian Citizen",
      highestDegree: "B.Tech Computer Science",
      university: "IIT Bombay",
      graduationYear: 2018,
      resumeText: "React developer with 6 years building web applications. Led frontend team at Infosys. Expert in TypeScript and modern React ecosystem. Experience with e-commerce and SaaS platforms.",
    },
  ];

  const createdProfiles: { id: string; fullName: string }[] = [];
  for (const candidateData of candidates) {
    const profile = await prisma.candidateProfile.create({ data: candidateData });
    createdProfiles.push({ id: profile.id, fullName: profile.fullName });
    console.log(`   ✓ Created candidate: ${profile.fullName}`);
  }

  // =========================================================================
  // AI SUMMARIES
  // =========================================================================
  console.log("\n🤖 Seeding AI summaries...");

  const amitProfile = createdProfiles[0];
  if (amitProfile) {
    await prisma.aiSummary.create({
      data: {
        profileId: amitProfile.id,
        status: AiSummaryStatus.COMPLETED,
        executiveSummary:
          "Amit Kapoor is a seasoned Senior React Developer with 6 years of hands-on experience architecting and delivering large-scale web applications. He has demonstrated strong technical leadership at Infosys, having led a team of 8 engineers across multiple high-traffic e-commerce and SaaS projects. His IIT Bombay pedigree and track record of building systems for 1M+ users make him a compelling candidate for senior individual contributor or team lead roles.",
        keySkillsSummary:
          "Core expertise: React (advanced), TypeScript, Node.js, GraphQL. Cloud: AWS (EC2, S3, Lambda). Strong in performance optimization, accessibility, and modern state management (Redux Toolkit, Zustand). Familiar with CI/CD and agile methodologies.",
        experienceSummary:
          "6 years total, with 4 years at Infosys as a senior developer/tech lead. Led frontend architecture for 3 major e-commerce platforms. Team leadership experience with 8 direct reports. Previous exposure to startup environments.",
        domainSummary:
          "Primary domain: E-Commerce and SaaS B2B platforms. Good understanding of high-scale consumer products. Limited exposure to banking/fintech or regulated industries.",
        strengthsSummary:
          "Strong technical depth in the React ecosystem. Proven leadership and mentoring ability. IIT Bombay background signals strong fundamentals. Short notice period (30 days) is advantageous.",
        possibleConcerns:
          "Salary expectation (₹18–22L) is at the higher end for this market. 90-day IIT Bombay alumni network may attract counter-offers. Limited cloud architecture ownership — AWS usage appears secondary to core frontend work.",
        workAuthSummary: "Indian Citizen. No visa or work permit requirements for positions within India.",
        noticePeriodSummary: "30 days. Can potentially negotiate a buy-out for urgent requirements.",
        salarySummary: "Expecting ₹18–22L per annum. This is a 20–30% premium over mid-market for this profile; however, the team lead experience partially justifies it.",
        recommendedAction: "Shortlist for technical screening. Schedule a 45-minute React/TypeScript assessment followed by a system design round. Fast-track if the team lead role is in scope.",
        fitScore: 82,
        model: "gpt-4o",
        promptTokens: 850,
        completionTokens: 420,
        totalCost: 0.019,
        generatedAt: new Date(),
      },
    });
    console.log(`   ✓ AI summary created for Amit Kapoor`);
  }

  // =========================================================================
  // CANDIDATE SUBMISSIONS
  // =========================================================================
  console.log("\n📋 Seeding candidate submissions...");

  if (amitProfile) {
    const submission1 = await prisma.candidateSubmission.create({
      data: {
        profileId: amitProfile.id,
        companyId: techcorpCompany.id,
        vendorId: talentbridgeVendor.id,
        status: CandidateSubmissionStatus.UNDER_REVIEW,
        reviewedBy: techcorpHM.id,
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        vendorNotes: "Strong candidate for the Senior React Developer role. Available in 30 days. Very interested in the position.",
        hasDuplicateAlert: true,
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`   ✓ Submission: ${amitProfile.fullName} → TechCorp India`);
  }

  const deepikaProfile = createdProfiles[1];
  if (deepikaProfile) {
    await prisma.candidateSubmission.create({
      data: {
        profileId: deepikaProfile.id,
        companyId: techcorpCompany.id,
        vendorId: talentbridgeVendor.id,
        status: CandidateSubmissionStatus.SHORTLISTED,
        reviewedBy: techcorpHM.id,
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        vendorNotes: "AWS certified DevOps engineer. Open to relocation to Bangalore.",
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`   ✓ Submission: ${deepikaProfile.fullName} → TechCorp India`);
  }

  const priyankaProfile = createdProfiles[3];
  if (priyankaProfile) {
    await prisma.candidateSubmission.create({
      data: {
        profileId: priyankaProfile.id,
        companyId: techcorpCompany.id,
        vendorId: talentbridgeVendor.id,
        status: CandidateSubmissionStatus.SUBMITTED,
        vendorNotes: "Top data scientist from IISc. Has published research. Available in 90 days.",
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`   ✓ Submission: ${priyankaProfile.fullName} → TechCorp India`);
  }

  // =========================================================================
  // DUPLICATE ALERTS
  // =========================================================================
  console.log("\n🔍 Seeding duplicate alerts...");

  const amitOriginal = createdProfiles[0];
  const amitDuplicate = createdProfiles[4];

  if (amitOriginal && amitDuplicate) {
    const duplicateAlert = await prisma.duplicateAlert.create({
      data: {
        companyId: techcorpCompany.id,
        profileAId: amitDuplicate.id,
        profileBId: amitOriginal.id,
        confidenceScore: 0.91,
        severity: DuplicateAlertSeverity.HIGH_CONFIDENCE,
        status: DuplicateAlertStatus.OPEN,
        matchedFields: ["current_company", "university", "graduation_year", "experience_years", "skills_overlap"],
        matchReason:
          "Profiles share the same current employer (Infosys), graduation university (IIT Bombay), graduation year (2018), identical years of experience (6), and 4 out of 5 core skills. Name 'Amit Kumar Kapoor' is very similar to 'Amit Kapoor'. High confidence this is the same person submitted by two different vendors.",
        detectionLayer: "FUZZY+SEMANTIC",
        similarityScore: 0.88,
        detectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`   ✓ Duplicate alert: Amit Kapoor vs Amit Kumar Kapoor (91% confidence)`);
  }

  // =========================================================================
  // INVITATIONS
  // =========================================================================
  console.log("\n✉️  Seeding invitations...");

  await prisma.invitation.create({
    data: {
      companyId: techcorpCompany.id,
      invitedBy: techcorpAdmin.id,
      email: "invite@newvendor.com",
      type: InvitationType.VENDOR,
      vendorName: "NewTech Staffing",
      message: "We'd love to have you onboard as a vendor partner for our engineering team.",
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`   ✓ Created pending vendor invitation\n`);

  // =========================================================================
  // AUDIT LOGS
  // =========================================================================
  console.log("📝 Seeding audit logs...");

  const auditEntries = [
    {
      companyId: techcorpCompany.id,
      actorId: techcorpAdmin.id,
      actorEmail: "priya@techcorpindia.com",
      actorRole: "COMPANY_ADMIN",
      action: "VENDOR_APPROVED",
      entity: "VendorCompany",
      entityId: talentbridgeVendor.id,
      after: { status: "APPROVED" },
      ipAddress: "103.21.58.22",
    },
    {
      companyId: techcorpCompany.id,
      actorId: techcorpAdmin.id,
      actorEmail: "priya@techcorpindia.com",
      actorRole: "COMPANY_ADMIN",
      action: "VENDOR_INVITED",
      entity: "Invitation",
      entityId: "invite@newvendor.com",
      after: { email: "invite@newvendor.com", type: "VENDOR" },
      ipAddress: "103.21.58.22",
    },
    {
      companyId: techcorpCompany.id,
      actorId: techcorpHM.id,
      actorEmail: "arjun@techcorpindia.com",
      actorRole: "HIRING_MANAGER",
      action: "CANDIDATE_SHORTLISTED",
      entity: "CandidateSubmission",
      entityId: deepikaProfile?.id ?? "unknown",
      before: { status: "UNDER_REVIEW" },
      after: { status: "SHORTLISTED" },
      ipAddress: "103.21.58.45",
    },
    {
      companyId: null,
      actorId: superAdmin.id,
      actorEmail: "admin@vendorflow.com",
      actorRole: "SUPER_ADMIN",
      action: "COMPANY_CREATED",
      entity: "Company",
      entityId: techcorpCompany.id,
      after: { name: "TechCorp India", slug: "techcorp-india" },
      ipAddress: "127.0.0.1",
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  console.log(`   ✓ Created ${auditEntries.length} audit log entries\n`);

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================
  console.log("🔔 Seeding notifications...");

  const notifications = [
    {
      userId: techcorpHM.id,
      companyId: techcorpCompany.id,
      type: "DUPLICATE_DETECTED",
      title: "Duplicate profile detected",
      body: "A possible duplicate of Amit Kapoor was submitted by CodeForce Staffing. Review required before proceeding.",
      link: "/dashboard/duplicates",
      isRead: false,
    },
    {
      userId: techcorpHM.id,
      companyId: techcorpCompany.id,
      type: "SUBMISSION_RECEIVED",
      title: "New candidate submitted",
      body: "TalentBridge India submitted a new candidate: Priyanka Rao (Data Scientist, 7 years exp)",
      link: "/dashboard/candidates",
      isRead: false,
    },
    {
      userId: techcorpAdmin.id,
      companyId: techcorpCompany.id,
      type: "VENDOR_PENDING",
      title: "Vendor awaiting approval",
      body: "Global Tech Recruit has completed their onboarding and is awaiting your approval.",
      link: "/dashboard/vendors",
      isRead: true,
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({ data: notif });
  }

  console.log(`   ✓ Created ${notifications.length} notifications\n`);

  // =========================================================================
  // DONE
  // =========================================================================
  console.log("✅ Seed completed successfully!\n");
  console.log("═".repeat(60));
  console.log("🚀 DEMO ACCOUNTS");
  console.log("═".repeat(60));
  console.log("");
  console.log("Super Admin:");
  console.log("  Email:    admin@vendorflow.com");
  console.log("  Password: Admin@123456");
  console.log("  URL:      /admin");
  console.log("");
  console.log("Company Admin (TechCorp India):");
  console.log("  Email:    priya@techcorpindia.com");
  console.log("  Password: Demo@123456");
  console.log("  URL:      techcorp-india.localhost:3000/dashboard");
  console.log("");
  console.log("Hiring Manager (TechCorp India):");
  console.log("  Email:    arjun@techcorpindia.com");
  console.log("  Password: Demo@123456");
  console.log("  URL:      techcorp-india.localhost:3000/dashboard");
  console.log("");
  console.log("Company Admin (GlobalHire):");
  console.log("  Email:    sarah@globalhire.io");
  console.log("  Password: Demo@123456");
  console.log("  URL:      globalhire.localhost:3000/dashboard");
  console.log("");
  console.log("Vendor Admin (TalentBridge India):");
  console.log("  Email:    ravi@talentbridge.in");
  console.log("  Password: Vendor@123456");
  console.log("  URL:      /vendor");
  console.log("");
  console.log("Vendor Recruiter (TalentBridge India):");
  console.log("  Email:    neha@talentbridge.in");
  console.log("  Password: Vendor@123456");
  console.log("  URL:      /vendor");
  console.log("═".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
