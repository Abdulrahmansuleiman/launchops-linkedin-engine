import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOutreachMessage } from "@/lib/ai";

export async function GET(req: Request) {
  const sequences = await prisma.outreachSequence.findMany({
    include: { messages: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sequences);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "generate") {
    const message = await generateOutreachMessage({
      prospectName: body.prospectName,
      prospectCompany: body.prospectCompany,
      prospectDetail: body.prospectDetail,
      step: body.step,
      context: body.context,
    });

    return NextResponse.json({ message });
  }

  if (body.action === "send") {
    const message = await prisma.outreachMessage.create({
      data: {
        sequenceId: body.sequenceId,
        leadId: body.leadId,
        stepNumber: body.stepNumber,
        content: body.content,
        status: "sent",
        sentAt: new Date(),
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: body.leadId },
      data: { status: "DM_SENT", lastContactedAt: new Date() },
    });

    return NextResponse.json(message);
  }

  const sequence = await prisma.outreachSequence.create({
    data: {
      accountId: body.accountId || "default",
      name: body.name,
      steps: body.steps,
    },
  });

  return NextResponse.json(sequence, { status: 201 });
}
