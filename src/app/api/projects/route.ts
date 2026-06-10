import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.clientId || !body.name) {
    return NextResponse.json({ error: "clientId and name are required" }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      clientId: body.clientId,
      name: body.name,
      description: body.description || null,
      status: body.status || "active",
      startDate: body.startDate ? new Date(body.startDate) : null,
      deadline: body.deadline ? new Date(body.deadline) : null,
    },
  })
  return NextResponse.json(project, { status: 201 })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const updateData: any = {}
  if (body.name) updateData.name = body.name
  if (body.description !== undefined) updateData.description = body.description
  if (body.status) updateData.status = body.status
  if (body.deadline) updateData.deadline = new Date(body.deadline)

  const updated = await prisma.project.update({ where: { id: body.id }, data: updateData })
  return NextResponse.json(updated)
}
