import { PrismaClient, LeadStatus, PostStatus, FeedbackRating } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.account.upsert({
    where: { email: "ray@launchopsai.click" },
    update: {},
    create: {
      name: "Raymon",
      email: "ray@launchopsai.click",
    },
  });

  console.log("Seeded account:", account.email);

  const leads = [
    { name: "Jordan Blake", headline: "CEO at Apex Ventures", company: "Apex Ventures", followerCount: 12500, status: LeadStatus.MEETING_BOOKED, score: 92, notes: "Commented 3x this week, active in AI space" },
    { name: "Priya Sharma", headline: "Founder at GrowthStack", company: "GrowthStack", followerCount: 8200, status: LeadStatus.CONNECTED, score: 78, notes: "Connected 2 days ago, likes AI content" },
    { name: "Marcus Webb", headline: "Director at ScaleUp Labs", company: "ScaleUp Labs", followerCount: 15100, status: LeadStatus.DM_SENT, score: 88, notes: "DM sent yesterday, high intent signals" },
    { name: "Emily Rowe", headline: "COO at LeadFlow Inc.", company: "LeadFlow Inc.", followerCount: 6800, status: LeadStatus.NEW, score: 45, notes: "New lead, needs nurture sequence" },
    { name: "David Kim", headline: "Partner at Ninja Agency", company: "Ninja Agency", followerCount: 21400, status: LeadStatus.RESPONDED, score: 85, notes: "DM replied — interested in white-label" },
    { name: "Nina Patel", headline: "CRO at ConvertPro", company: "ConvertPro", followerCount: 9300, status: LeadStatus.DEMO_SENT, score: 95, notes: "Demo done — likely to close this week" },
    { name: "Tom Erikson", headline: "Founder at Pulse AI", company: "Pulse AI", followerCount: 5200, status: LeadStatus.CLIENT_WON, score: 97, notes: "Closed deal — £12K annual, AI text agents" },
    { name: "Aisha Okafor", headline: "Head of Growth at ScaleFast", company: "ScaleFast", followerCount: 11200, status: LeadStatus.CONNECTED, score: 72, notes: "Warm lead, mutual connection with Jordan" },
    { name: "Carlos Mendez", headline: "CEO at LeadGen Labs", company: "LeadGen Labs", followerCount: 7800, status: LeadStatus.NEW, score: 55, notes: "Scraped from competitor followers list" },
    { name: "Sarah Chen", headline: "VP Sales at TechVentures", company: "TechVentures", followerCount: 16500, status: LeadStatus.MEETING_BOOKED, score: 90, notes: "Meeting next Tue — high-value prospect" },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: { ...lead, accountId: account.id },
    });
  }

  console.log("Seeded 10 leads");

  const posts = [
    { content: "AI agents aren't replacing humans — they're replacing slow humans.\n\nI've deployed 50+ AI text agents for business owners.\n\nHere's what actually works:\n\n1. Response under 30 seconds (not 5 minutes)\n2. Qualification first, booking second\n3. Human handoff when the lead is ready\n\nWhat's your biggest lead generation challenge right now? 👇", topic: "AI agents vs humans", score: 87, impressions: 3200, likes: 142, comments: 38, shares: 24, saves: 67, weekLabel: "2026-W24" },
    { content: "I went from losing leads at 2am to closing them while I sleep.\n\nNot because I hired more people.\n\nBecause I installed an AI text agent.\n\nThe speed of response matters more than the pitch.\n\nWant to see how it works? Drop a comment.", topic: "Personal AI story", score: 82, impressions: 2100, likes: 98, comments: 29, shares: 15, saves: 42, weekLabel: "2026-W24" },
    { content: "Your leads are going to voicemail right now.\n\nAnd they're not calling back.\n\nThe top 1% respond in under 30 seconds.\n\nI built AI text agents that do this automatically.\n\nThe result? 3x more booked calls. 40+ hours saved per week.\n\nWant me to show you how? Drop a comment or DM me.", topic: "Lead response time", score: 91, impressions: 2800, likes: 167, comments: 52, shares: 31, saves: 89, weekLabel: "2026-W23" },
    { content: "Most lead gen systems fail because they're built for the founder, not the prospect.\n\nHere's a better framework:\n\n• Speed (respond in <30s)\n• Relevance (personalize every touch)\n• Persistence (follow up 5-7 times)\n• Empathy (understand their pain)\n\nAI handles all 4. Humans handle the relationship.\n\nThat's the winning combo.", topic: "Lead gen framework", score: 78, impressions: 1500, likes: 67, comments: 18, shares: 12, saves: 34, weekLabel: "2026-W23" },
    { content: "Text agents vs VAs — which one wins?\n\nVA: $5-15/hr, needs training, sleeps 8hrs\n\nAI text agent: $0.02/chat, instant deploy, never sleeps\n\nBoth have their place. But for lead qualification at 2am?\n\nAI wins every time.", topic: "Text agents vs VAs", score: 81, impressions: 1900, likes: 88, comments: 41, shares: 22, saves: 55, weekLabel: "2026-W23" },
    { content: "The AI advantage in 2026 isn't about the tech.\n\nIt's about who deploys it first.\n\nEvery week you wait is another 15-20 leads slipping through.\n\nEarly adopters are pulling ahead.\n\nDon't get left behind.", topic: "AI advantage 2026", score: 85, impressions: 2400, likes: 112, comments: 33, shares: 28, saves: 71, weekLabel: "2026-W22" },
  ];

  for (const post of posts) {
    await prisma.post.create({
      data: { ...post, accountId: account.id, status: PostStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  console.log("Seeded 6 posts");

  const ideas = [
    { topic: "Why slow lead response costs you £50K/year", angle: "Pain point — money left on table", score: 90 },
    { topic: "The 3-step AI qualification framework", angle: "How-to — teach a system", score: 76 },
    { topic: "I replaced my SDR team with one AI agent", angle: "Case study — personal story", score: 88 },
    { topic: "Why speed beats perfection in sales", angle: "Mindset — contrarian take", score: 85 },
    { topic: "Client acquisition playbook for 2026", angle: "Strategy — high value", score: 82 },
  ];

  for (const idea of ideas) {
    await prisma.contentIdea.create({
      data: { ...idea, accountId: account.id, source: "AI Generated" },
    });
  }

  console.log("Seeded 5 content ideas");

  const sequence = await prisma.outreachSequence.create({
    data: {
      accountId: account.id,
      name: "Ty Frankel Style — Connect to Demo",
      isActive: true,
      steps: [
        { step: 1, name: "Connect DM", delay: "Day 1", content: "Hey {{name}}, loved your post about {{topic}}. I work with agency owners on AI lead gen — any overlap?" },
        { step: 2, name: "Follow-up 1", delay: "Day 3", content: "Totally get it if not the right fit. I built a system that books 3-5 demos/week on autopilot using AI agents. If curious, happy to show you." },
        { step: 3, name: "Follow-up 2", delay: "Day 5", content: "No pressure. Here's a 2min Loom showing exactly how it works: {{loom_link}}" },
        { step: 4, name: "Follow-up 3", delay: "Day 7", content: "Last one — if timing's off, no worries. I'll circle back in a few weeks. In the meantime, here's a case study: {{case_link}}" },
        { step: 5, name: "Close", delay: "Day 10", content: "Has this been helpful? Happy to hop on a 10min call to dive deeper. Let me know what works." },
      ],
    },
  });

  console.log("Seeded outreach sequence:", sequence.name);

  const competitorPosts = [
    { authorName: "Alex Hormozi", authorUrl: "https://linkedin.com/in/alexhormozi", content: "The money is in the follow-up. Always has been. Always will be.", topic: "Follow-up", engagement: { likes: 5200, comments: 340 } },
    { authorName: "Sam Parr", authorUrl: "https://linkedin.com/in/samparr", content: "Most people overthink content. Just help one person and hit publish.", topic: "Content strategy", engagement: { likes: 3800, comments: 210 } },
    { authorName: "Justin Welsh", authorUrl: "https://linkedin.com/in/justinwelsh", content: "Your personal brand is just a byproduct of helping people publicly, consistently, for a long time.", topic: "Personal branding", engagement: { likes: 4500, comments: 280 } },
  ];

  for (const cp of competitorPosts) {
    await prisma.competitorPost.create({
      data: { ...cp, accountId: account.id, analysis: { sentiment: "positive", keyTakeaway: "Consistency and value-first approach" } },
    });
  }

  console.log("Seeded 3 competitor posts");

  const report = await prisma.weeklyReport.create({
    data: {
      accountId: account.id,
      weekLabel: "2026-W24",
      report: {
        totalImpressions: 13100,
        engagementRate: 4.8,
        newLeads: 18,
        demosBooked: 5,
        topPost: "AI agents aren't replacing humans",
        bestTime: "Tue-Thu 8-10am",
        recommendation: "Double down on client story posts — they drive 2.3x more demo bookings",
      },
    },
  });

  console.log("Seeded weekly report:", report.weekLabel);
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
