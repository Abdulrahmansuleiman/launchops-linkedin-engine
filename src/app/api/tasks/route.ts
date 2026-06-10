import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.projectId || !body.title) {
    return NextResponse.json({ error: "projectId and title are required" }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      projectId: body.projectId,
      title: body.title,
      description: body.description || null,
      status: body.status || "todo",
      priority: body.priority || "medium",
      assignee: body.assignee || null,
      deadline: body.deadline ? new Date(body.deadline) : null,
    },
  })
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
  if (body.status === "done") updateData.completedAt = new Date()
  else if (body.status && body.status !== "done") updateData.completedAt = null

  const updated = await prisma.task.update({ where: { id: body.id }, data: updateData })
  return NextResponse.json(updated)
}
