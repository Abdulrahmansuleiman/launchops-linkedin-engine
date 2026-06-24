import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const data: any = { ...body };
  if (body.stage === "PUBLISHED" && !body.publishedAt) {
    data.publishedAt = new Date();
  }

  const ad = await prisma.ad.update({
    where: { id },
    data,
  });

  return NextResponse.json(ad);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.ad.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
