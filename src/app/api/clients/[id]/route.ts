import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      lead: { select: { name: true, linkedinUrl: true, score: true } },
      projects: {
        include: { tasks: { orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const updateData: any = {}
  if (body.pipelineStage) updateData.pipelineStage = body.pipelineStage
  if (body.onboardingStatus) updateData.onboardingStatus = body.onboardingStatus
  if (body.notes !== undefined) updateData.notes = body.notes
  if (body.contractContent !== undefined) updateData.contractContent = body.contractContent
  if (body.goals !== undefined) updateData.goals = body.goals

  const updated = await prisma.client.update({ where: { id }, data: updateData })
  return NextResponse.json(updated)
}
