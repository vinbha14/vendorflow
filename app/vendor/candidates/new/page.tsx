// app/vendor/candidates/new/page.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Plus, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { CvUploadZone } from "@/components/candidates/cv-upload-zone"
import { submitCandidateProfile, candidateProfileSchema, type CandidateProfileInput } from "@/services/candidate.service"
import { ROUTES } from "@/config/constants"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

// Common skill suggestions
const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Node.js", "Python", "Java", "AWS", "Docker",
  "Kubernetes", "SQL", "MongoDB", "GraphQL", "Next.js", "Vue.js", "Angular",
  "Go", "Rust", "C++", "DevOps", "Machine Learning", "Data Science",
]

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERNSHIP", label: "Internship" },
]

interface AssignedCompany {
  id: string
  name: string
  logoUrl?: string | null
  primaryColor: string
}

export default function NewCandidatePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState("")
  const [assignedCompanies, setAssignedCompanies] = useState<AssignedCompany[]>([])
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CandidateProfileInput>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      country: "IN",
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
      skills: [],
      domainExpertise: [],
      experienceYears: 0,
    },
  })

  const skills = watch("skills") ?? []
  const resumeUrl = watch("resumeUrl")

  // Load assigned companies on mount
  useEffect(() => {
    fetch("/api/vendor/companies")
      .then((r) => r.json())
      .then((data) => setAssignedCompanies(data.companies ?? []))
      .catch(() => {})
  }, [])

  const addSkill = (skill: string) => {
    const cleaned = skill.trim()
    if (!cleaned || skills.includes(cleaned) || skills.length >= 20) return
    setValue("skills", [...skills, cleaned])
    setSkillInput("")
  }

  const removeSkill = (skill: string) => {
    setValue("skills", skills.filter((s) => s !== skill))
  }

  const onSubmit = (data: CandidateProfileInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await submitCandidateProfile(data)
      if (!result.success) {
        setServerError(result.error ?? "Submission failed. Please try again.")
        return
      }
      setSubmitted(true)
      setTimeout(() => router.push(ROUTES.VENDOR_CANDIDATES), 2000)
    })
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold">Candidate submitted!</h2>
        <p className="text-muted-foreground max-w-sm">
          The profile has been submitted. The hiring team will be notified and our AI is already analyzing the CV.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting you back…</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Submit a Candidate"
        description="Fill in the candidate details. The hiring team will receive an AI-generated summary alongside this submission."
        actions={
          <Button variant="ghost" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Submit to company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="companyId">Company <span className="text-destructive">*</span></Label>
              <select
                id="companyId"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  errors.companyId && "border-destructive"
                )}
                {...register("companyId")}
              >
                <option value="">Select a company</option>
                {assignedCompanies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.companyId && (
                <p className="text-xs text-destructive">{errors.companyId.message}</p>
              )}
              {assignedCompanies.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No assigned companies found. You need to be approved by a company before submitting candidates.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CV Upload */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">CV / Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <CvUploadZone
              vendorId="current"
              onUploadComplete={(fileUrl, key, fileName) => {
                setValue("resumeUrl", fileUrl)
                setValue("resumeKey", key)
              }}
              existingFileUrl={resumeUrl}
            />
            {!resumeUrl && (
              <p className="text-xs text-muted-foreground mt-2">
                Upload a CV to enable AI-powered summary and analysis.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="fullName">Full name <span className="text-destructive">*</span></Label>
                <Input
                  id="fullName"
                  placeholder="Amit Kapoor"
                  autoFocus
                  className={cn(errors.fullName && "border-destructive")}
                  {...register("fullName")}
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="candidate@email.com" {...register("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" {...register("phone")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Current location</Label>
                <Input id="location" placeholder="Bangalore, India" {...register("location")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input id="linkedinUrl" placeholder="https://linkedin.com/in/..." {...register("linkedinUrl")} />
                {errors.linkedinUrl && <p className="text-xs text-destructive">{errors.linkedinUrl.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Professional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="currentTitle">Current title <span className="text-destructive">*</span></Label>
                <Input
                  id="currentTitle"
                  placeholder="Senior React Developer"
                  className={cn(errors.currentTitle && "border-destructive")}
                  {...register("currentTitle")}
                />
                {errors.currentTitle && <p className="text-xs text-destructive">{errors.currentTitle.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currentCompany">Current company</Label>
                <Input id="currentCompany" placeholder="Infosys" {...register("currentCompany")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="experienceYears">Years of experience <span className="text-destructive">*</span></Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  placeholder="6"
                  className={cn(errors.experienceYears && "border-destructive")}
                  {...register("experienceYears", { valueAsNumber: true })}
                />
                {errors.experienceYears && <p className="text-xs text-destructive">{errors.experienceYears.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="employmentType">Employment type</Label>
                <select
                  id="employmentType"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register("employmentType")}
                >
                  <option value="">Select type</option>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label>
                Skills <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-1">({skills.length}/20)</span>
              </Label>

              {/* Selected skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Skill input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a skill and press Enter or +"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput) }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => addSkill(skillInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 10).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
              {errors.skills && <p className="text-xs text-destructive">{errors.skills.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Availability & Compensation */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Availability &amp; Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="noticePeriodDays">Notice period (days)</Label>
                <Input
                  id="noticePeriodDays"
                  type="number"
                  min="0"
                  max="365"
                  placeholder="30"
                  {...register("noticePeriodDays", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workAuthorization">Work authorization</Label>
                <Input
                  id="workAuthorization"
                  placeholder="Indian Citizen, H1B, PR..."
                  {...register("workAuthorization")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expectedSalaryMin">Expected salary (min)</Label>
                <div className="flex gap-2">
                  <select
                    className="flex h-9 w-20 shrink-0 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                    {...register("salaryCurrency")}
                  >
                    {["INR", "USD", "GBP", "EUR", "SGD", "AED"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Input
                    id="expectedSalaryMin"
                    type="number"
                    placeholder="1,500,000"
                    {...register("expectedSalaryMin", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expectedSalaryMax">Expected salary (max)</Label>
                <Input
                  id="expectedSalaryMax"
                  type="number"
                  placeholder="2,000,000"
                  {...register("expectedSalaryMax", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="highestDegree">Highest degree</Label>
                <Input id="highestDegree" placeholder="B.Tech Computer Science" {...register("highestDegree")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="university">University / Institution</Label>
                <Input id="university" placeholder="IIT Bombay" {...register("university")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="graduationYear">Graduation year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  min="1970"
                  max={new Date().getFullYear() + 5}
                  placeholder="2018"
                  {...register("graduationYear", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes to hiring team */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Notes to hiring team</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              rows={3}
              placeholder="Any relevant context for the hiring team — availability, relocation preferences, interview urgency, etc."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              {...register("vendorNotes")}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={isPending}>
            {!isPending && (
              <>
                Submit candidate
                <ArrowRight className="h-4 w-4" />
              </>
            )}
            {isPending && "Submitting…"}
          </Button>
        </div>
      </form>
    </div>
  )
}
