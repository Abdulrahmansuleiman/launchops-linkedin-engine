import { openai } from "./openai";

const SYSTEM_PROMPT = `You are a LinkedIn content strategist and outreach expert. 
Your style is direct, conversational, and relationship-first (like Ty Frankel's approach).
You analyze posts, generate drafts, score content, and craft outreach messages.
You learn from feedback to improve over time.`;

export async function generatePostDrafts(params: {
  topic: string;
  tone?: string;
  competitorPosts?: string[];
  pastFeedback?: string;
  count?: number;
}) {
  const prompt = `Generate ${params.count || 3} LinkedIn post drafts about "${params.topic}".
Tone: ${params.tone || "conversational, insightful, authority-building"}
${params.competitorPosts?.length ? `Reference competitor insights: ${params.competitorPosts.join("\n")}` : ""}
${params.pastFeedback ? `Learn from past performance: ${params.pastFeedback}` : ""}

For each draft, provide:
1. The full post content (800-1200 chars)
2. A hook score (0-100)
3. Predicted impression range
4. Why this will work

Return as JSON array.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}

export async function analyzePost(postContent: string) {
  const prompt = `Analyze this LinkedIn post and provide:
1. Overall score (0-100)
2. Hook strength score (0-100)
3. Structure score
4. Emotional trigger analysis
5. Suggested improvements
6. Predicted impression range for an account with 5K followers

Post: "${postContent}"`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}

export async function generateOutreachMessage(params: {
  prospectName: string;
  prospectCompany: string;
  prospectDetail: string;
  step: "connect" | "dm1" | "dm2" | "dm3" | "demo";
  context?: string;
}) {
  const templates = {
    connect: `Write a LinkedIn connection note (max 300 chars) for ${params.prospectName} at ${params.prospectCompany}. Mention ${params.prospectDetail}. Casual, confident tone.`,
    dm1: `Write a first DM to ${params.prospectName}. Reference ${params.prospectDetail}. Ask about their business. Use Ty Frankel style: casual, interested in THEM first. End with a question.`,
    dm2: `Follow-up DM to ${params.prospectName}. Build on previous conversation. Show understanding of their business.`,
    dm3: `Send a demo video offer to ${params.prospectName}. "Here's how we save 40+ hrs/week and 2x conversion." Short, value-focused. Include booking link.`,
    demo: `Demo follow-up to ${params.prospectName}. Check if they watched the video. Offer to answer questions.`,
  };

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: templates[params.step] + (params.context ? `\nContext: ${params.context}` : "") },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}

export async function getWeeklyInsights(params: {
  weekPosts: { content: string; impressions?: number; likes?: number; comments?: number; rating?: string }[];
  previousWeeks?: string;
}) {
  const prompt = `Analyze this week's LinkedIn posts and provide:
1. Best performing post and why
2. Worst performing post and why
3. Pattern extraction (what's working)
4. Next week's recommended topics (3)
5. Suggested improvements

Posts: ${JSON.stringify(params.weekPosts)}
${params.previousWeeks ? `Previous trends: ${params.previousWeeks}` : ""}`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}
