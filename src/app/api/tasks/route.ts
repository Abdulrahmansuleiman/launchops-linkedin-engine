import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const scope = url.searchParams.get("scope")
  const status = url.searchParams.get("status")
  const pipelineStage = url.searchParams.get("pipelineStage")
  const priority = url.searchParams.get("priority")
  const search = url.searchParams.get("search")

  const where: any = {}

  if (scope) where.scope = scope
  if (status) where.status = status
  if (pipelineStage) where.pipelineStage = pipelineStage
  if (priority) where.priority = priority
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { assignee: { contains: search, mode: "insensitive" } },
    ]
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, clientId: true, client: { select: { id: true, companyName: true } } } },
    },
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 })

  const data: any = {
    title: body.title,
    description: body.description || null,
    status: body.status || "todo",
    priority: body.priority || "medium",
    scope: body.scope || "client",
    assignee: body.assignee || null,
    deadline: body.deadline ? new Date(body.deadline) : null,
  }

  if (body.scope === "pipeline") {
    if (!body.pipelineStage) return NextResponse.json({ error: "pipelineStage is required for pipeline tasks" }, { status: 400 })
    data.pipelineStage = body.pipelineStage
  } else {
    if (!body.projectId) return NextResponse.json({ error: "projectId is required for client tasks" }, { status: 400 })
    data.projectId = body.projectId
  }

  const task = await prisma.task.create({ data })
  return NextResponse.json(task, { status: 201 })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const updateData: any = {}
  if (body.title) updateData.title = body.title
  if (body.description !== undefined) updateData.description = body.description
  if (body.status) updateData.status = body.status
  if (body.priority) updateData.priority = body.priority
  if (body.assignee !== undefined) updateData.assignee = body.assignee
  if (body.deadline) updateData.deadline = new Date(body.deadline)
  if (body.pipelineStage) updateData.pipelineStage = body.pipelineStage
  if (body.scope) updateData.scope = body.scope
  if (body.status === "done") updateData.completedAt = new Date()
  else if (body.status && body.status !== "done") updateData.completedAt = null

  const updated = await prisma.task.update({ where: { id: body.id }, data: updateData })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
