import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateContractHtml } from "@/lib/contract"

async function getDefaultAccountId() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } })
  if (!account) throw new Error("No account found. Create an account first.")
  return account.id
}

export async function GET() {
  const accountId = await getDefaultAccountId()
  const clients = await prisma.client.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    include: { lead: { select: { name: true, linkedinUrl: true, score: true } } },
  })
  return NextResponse.json(clients)
}

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.leadId || !body.companyName || !body.contactName) {
    return NextResponse.json({ error: "leadId, companyName, and contactName are required" }, { status: 400 })
  }

  const accountId = await getDefaultAccountId()

  const lead = await prisma.lead.findUnique({ where: { id: body.leadId } })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const existing = await prisma.client.findUnique({ where: { leadId: body.leadId } })
  if (existing) {
    return NextResponse.json({ error: "Client already exists for this lead" }, { status: 409 })
  }

  const services: string[] = Array.isArray(body.services) ? body.services : []

  const contractInput = {
    companyName: body.companyName,
    contactName: body.contactName,
    contactEmail: body.contactEmail || lead.email || undefined,
    website: body.website || undefined,
    services: services.length > 0 ? services : ["LinkedIn Growth Services"],
    scope: body.scope || "Full LinkedIn growth management including content strategy, content creation, outreach automation, and pipeline management.",
    monthlyRetainer: body.monthlyRetainer ? parseFloat(body.monthlyRetainer) : undefined,
    setupFee: body.setupFee ? parseFloat(body.setupFee) : undefined,
    contractDuration: body.contractDuration ? parseInt(body.contractDuration) : undefined,
    paymentTerms: body.paymentTerms || undefined,
    goals: body.goals || undefined,
  }

  const contractHtml = generateContractHtml(contractInput)

  const client = await prisma.client.create({
    data: {
      accountId,
      leadId: body.leadId,
      companyName: body.companyName,
      contactName: body.contactName,
      contactEmail: body.contactEmail || lead.email,
      contactPhone: body.contactPhone,
      website: body.website,
      industry: body.industry,
      services,
      scope: contractInput.scope,
      goals: body.goals,
      monthlyRetainer: contractInput.monthlyRetainer,
      setupFee: contractInput.setupFee,
      contractDuration: contractInput.contractDuration,
      paymentTerms: body.paymentTerms,
      onboardingStatus: "CONTRACT_DRAFTED",
      contractContent: contractHtml,
      contractGeneratedAt: new Date(),
    },
  })

  await prisma.lead.update({
    where: { id: body.leadId },
    data: { status: "CLIENT_WON" },
  })

  return NextResponse.json(client, { status: 201 })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const updateData: any = {}
  if (data.onboardingStatus) updateData.onboardingStatus = data.onboardingStatus
  if (data.notes !== undefined) updateData.notes = data.notes

  const updated = await prisma.client.update({ where: { id }, data: updateData })
  return NextResponse.json(updated)
}
