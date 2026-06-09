import { openai } from "./openai";

const SKILL = `# LaunchOps LinkedIn Outreach Skill

## Who Raymon Is
- Founder of LaunchOps AI — builds AI-powered lead follow-up pipelines (text + voice agents)
- Core offer: converts 40+ hours of manual lead qualification into automated pipelines that respond in under 60 seconds, qualify conversationally, book calls to calendar, log to GHL
- Background: cold calling — understands the human side of sales
- Booking link: https://calendly.com/launchops-automation/30min
- Demo video: https://youtu.be/HDNUqTAHYbw
- Based in UK

## Three ICP Types
1. Agency owners / marketing agencies — Done-for-you AI pipeline build
2. Local business owners (solar, HVAC, dental, clinics, finance, mortgage, real estate) — Direct build
3. Freelancers / consultants — White-label resell model

## The Core Pain to Surface
Leads going cold because nobody follows up fast enough. A lead not contacted within 5 minutes is 21x less likely to convert.

## THE OPENER TEMPLATE (always use this for first messages)
One line per send — feels like real-time typing, not a template.
Never pitch in the opener. Never mention AI, automation, or LaunchOps in the opener.

## CONVERSATION FLOW
Step 1 — They reply to opener: Match their energy. Be warm. One casual line back + ONE question about their business.
Step 2 — Surface the pain: Ask about lead follow-up speed.
Step 3 — They reveal the pain: If slow, say "[X days/hours] is actually where most leads go cold — they've already booked with someone else by then. Are you open to seeing how that gap could be fixed without changing anything in your current setup?"
Step 4 — Drop the frame: "That's actually exactly what I build — automated follow up systems that respond in under 60 seconds, qualify the lead and book the call without any manual work. Would make a lot of sense for [their business/clients] honestly. Want me to show you what that looks like?"
Step 5 — They say yes: "Perfect — easiest is just a quick 20 mins on a call. I'll walk you through exactly how it works and we can see if it makes sense: [cal link]"
OR send demo video first: "What I like to do is send a demo video from a client so you can see how it works before we jump on a call — here: https://youtu.be/HDNUqTAHYbw"

## TONALITY RULES (Ty Frankel style — non-negotiable)
- One thought per message send
- Casual, warm, entrepreneurial
- Match their energy and vocabulary
- Use their city/location naturally
- Emojis used sparingly and naturally
- Short sentences — never a wall of text
- Ask ONE question per reply
- Make them feel understood before offering anything
- Never pitch in the opener
- Never "Just checking in" follow-ups
- Never use AI slop phrases`;

const SYSTEM_PROMPT = `You are Raymon's (LaunchOps AI) LinkedIn outreach assistant. You use the Ty Frankel style: casual, brotherly, research-heavy, relationship-first.

${SKILL}

CRITICAL RULES:
- One thought per message. Never send a wall of text.
- For first messages, ALWAYS use the opener template format — line by line, one per send.
- Never pitch AI/automation/LaunchOps in the opener.
- Always surface the pain around lead follow-up speed before offering anything.
- Match their energy, use their city, be human.
- Never sound like a bot or template. Never use "I hope this finds you well", "leverage", "synergy".`;

export async function generatePostDrafts(params: {
  topic: string;
  competitorPosts?: string[];
  pastFeedback?: string;
  count?: number;
}) {
  const prompt = `Generate ${params.count || 3} LinkedIn post drafts about "${params.topic}".
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
  prospectCompany?: string;
  prospectTitle?: string;
  prospectLocation?: string;
  prospectDetail?: string;
  industry?: string;
  step: "opener" | "reply" | "surface" | "pivot" | "demo" | "follow-up" | "objection";
  context?: string;
  conversationHistory?: string;
}) {
  const stepPrompts: Record<string, string> = {
    opener: `Write a Ty Frankel style opener for ${params.prospectName}${params.prospectCompany ? ` at ${params.prospectCompany}` : ""}${params.prospectTitle ? ` (${params.prospectTitle})` : ""}${params.prospectLocation ? ` based in ${params.prospectLocation}` : ""}.

Use the opener template format — one line per send, like real-time typing:
1. "Hey [Name]"
2. "[Company] looks interesting"
3. "That's all you? Or you have a team"
4. Ask what they do
5. Ask how long they've been running it
6. A genuine local line about their city

Rules:
- Never pitch in the opener
- Never mention AI, automation, or LaunchOps
- Never mention their banner image
- Local line must feel genuine
- If UK-based, use: "London based too — always good connecting with people building something solid close to home"

Return as a JSON object with a "messages" array of strings, one per line.`,

    reply: `Write a reply to ${params.prospectName} following the Ty Frankel style.

Conversation so far:
${params.conversationHistory || ""}

${params.context || ""}

Rules:
- Match their energy
- One thought per send
- One question about their business
- Warm, casual, entrepreneurial tone
- Never pitch yet — this is Step 1 of the flow`,

    surface: `Surface the pain around lead follow-up speed with ${params.prospectName}.

${params.industry ? `Industry: ${params.industry}` : ""}
${params.context ? `Context: ${params.context}` : ""}

Pick the right angle based on their business type:
- Agency/service business: "When a new client reaches out, how fast does someone get back to them?"
- Local biz (solar/HVAC/mortgage/dental/clinic): "When a lead comes in, how fast is someone actually calling them back?"
- Real estate: "When leads come in from ads, how fast is someone following up on those?"
- Solopreneur: "Being self employed — when someone reaches out, how quick are you jumping on it?"

Return as a JSON object with "message" (the exact line to send).`,

    pivot: `Write a pain pivot reply for ${params.prospectName}.

Conversation so far:
${params.conversationHistory || ""}

${params.context || ""}

If they said they're slow to respond (same day, next day, days):
> "[X time] is actually where most leads go cold — they've already booked with someone else by then. Are you open to seeing how that gap could be fixed without changing anything in your current setup?"

If they said they respond fast (within minutes):
Pivot to volume: "That's solid — how many new enquiries are you getting a month roughly?"
Then: "When it spikes like that, are you able to handle all of them or do some slip through?"

If they said it's already automated:
Ask: "Nice — what stack are you using for it?" Then: "And how's the conversion rate looking?"

Return as JSON with "message".`,

    demo: `Write a demo offer message for ${params.prospectName}.

Drop the frame — sell outcome, not build:
"That's actually exactly what I build — automated follow up systems that respond in under 60 seconds, qualify the lead and book the call without any manual work. Would make a lot of sense for [their business/clients] honestly. Want me to show you what that looks like?"

Or if they already said yes to seeing it:
"Perfect — easiest is just a quick 20 mins on a call. I'll walk you through exactly how it works and we can see if it makes sense: https://calendly.com/launchops-automation/30min"

Or send video first:
"What I like to do is send a demo video from a client so you can see how it works before we jump on a call — here: https://youtu.be/HDNUqTAHYbw"

Return as JSON with "message".`,

    "follow-up": `Write a follow-up to ${params.prospectName}.

Context: ${params.context || ""}

Follow-up sequence rules:
- Day 1 after last message → Bump: "hey [Name] — just bumping this up in case it got buried 👋"
- Day 4 after last message → New angle: "hey [Name] — totally understand if the timing's off. One last question — how are you currently handling follow up when new leads come in?"
- After 3 no-replies → Mark for 30-60 day re-engage, send nothing

Return as JSON with "message".`,

    objection: `Handle this objection from ${params.prospectName}:

Context: ${params.context || ""}
Conversation: ${params.conversationHistory || ""}

Use these objection pivots:
- "We're doing fine": "That's the best position to be in — you already have demand. Quick question: what's your lead-to-booked-call rate right now?"
- "We use a VA": "How fast can your VA respond when a lead comes in at 9pm on a Friday? That's where the system breaks."
- "Not interested in AI": "I get that — most people that say that have seen chatbots that feel robotic. What I build is conversational. Your leads don't know it's automated."
- "What does it cost?": "Depends on what you need — that's what the call is for. But bigger question: how much are slow responses costing you right now?"
- "Not now / too busy": "No worries at all — drop me a message whenever the time is right 👊" (then wait 2-3 weeks)

Return as JSON with "message".`,
  };

  const prompt = stepPrompts[params.step] || stepPrompts.opener;

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
