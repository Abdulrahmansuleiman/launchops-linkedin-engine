import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
