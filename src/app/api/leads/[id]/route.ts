import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, client: { select: { id: true } } },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.client) {
    return NextResponse.json(
      { error: "This lead has been converted to a client. Delete the client first." },
      { status: 409 }
    );
  }

  await prisma.outreachMessage.updateMany({ where: { leadId: id }, data: { leadId: null } });
  await prisma.lead.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
