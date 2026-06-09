const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.outreachMessage.deleteMany({});
  await prisma.outreachSequence.deleteMany({});
  await prisma.leadActivity.deleteMany({});
  await prisma.pipelineEntry.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.contentIdea.deleteMany({});
  await prisma.competitorPost.deleteMany({});
  await prisma.weeklyReport.deleteMany({});
  await prisma.lead.deleteMany({});
  console.log("All data wiped successfully.");
}

main().catch((e) => console.error(e)).finally(() => prisma.$disconnect());
