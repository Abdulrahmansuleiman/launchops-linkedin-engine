import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function getDefaultAccountId() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } })
  if (!account) throw new Error("No account found. Create an account first.")
  return account.id
}

export async function POST(req: Request) {
  const body = await req.json()
  const rows: { companyName: string; contactName: string; contactEmail?: string; contactPhone?: string; industry?: string; monthlyRetainer?: number; pipelineStage?: string }[] = body.clients

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Provide at least one client" }, { status: 400 })
  }

  const accountId = await getDefaultAccountId()
  const created: number = 0
  const errors: string[] = []

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      if (!row.companyName?.trim() || !row.contactName?.trim()) {
        throw new Error(`Missing companyName or contactName for entry: ${row.companyName || "?"}`)
      }

      const lead = await prisma.lead.create({
        data: {
          accountId,
          name: row.contactName.trim(),
          company: row.companyName.trim(),
          email: row.contactEmail?.trim() || null,
          phone: row.contactPhone?.trim() || null,
          score: 50,
          status: "NEW",
        },
      })

      await prisma.client.create({
        data: {
          accountId,
          leadId: lead.id,
          companyName: row.companyName.trim(),
          contactName: row.contactName.trim(),
          contactEmail: row.contactEmail?.trim() || null,
          contactPhone: row.contactPhone?.trim() || null,
          industry: row.industry?.trim() || null,
          monthlyRetainer: row.monthlyRetainer || null,
          pipelineStage: row.pipelineStage?.trim() || "Discovery",
          onboardingStatus: "PENDING_FORM",
        },
      })
    })
  )

  let imported = 0
  let failed = 0
  for (const r of results) {
    if (r.status === "fulfilled") imported++
    else { failed++; errors.push(r.reason?.message || "Unknown error") }
  }

  return NextResponse.json({ imported, failed, errors: errors.slice(0, 5) }, { status: 201 })
}
