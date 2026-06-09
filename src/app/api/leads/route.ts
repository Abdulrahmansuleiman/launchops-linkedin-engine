import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};
  if (status && status !== "all") where.status = status.toUpperCase();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { score: "desc" },
    take: 100,
  });

  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const body = await req.json();
  const lead = await prisma.lead.create({
    data: {
      accountId: body.accountId || "default",
      linkedinUrl: body.linkedinUrl,
      name: body.name,
      headline: body.headline,
      company: body.company,
      score: body.score || 0,
      status: "NEW",
    },
  });
  return NextResponse.json(lead, { status: 201 });
}
