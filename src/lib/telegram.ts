import { prisma } from "./prisma";

const API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const STAGES = ["IDEAS", "SCRIPTING", "EDITING", "QA", "POSTED"] as const;
const STAGE_LABELS: Record<string, string> = {
  IDEAS: "💡 Ideas",
  SCRIPTING: "✍️ Scripting",
  EDITING: "✏️ Editing",
  QA: "👁 Quality Assurance",
  POSTED: "✅ Posted",
};

let offset = 0;
let polling = false;

// ─── Telegram helpers ───────────────────────────────────────────────

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup || undefined,
    }),
  });
}

async function sendTyping(chatId: number) {
  await fetch(`${API}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

// ─── Account helpers ────────────────────────────────────────────────

async function getDefaultAccountId() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) throw new Error("No account found");
  return account.id;
}

async function ensureChatId(chatId: number) {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) return;
  if (account.telegramChatId !== String(chatId)) {
    await prisma.account.update({
      where: { id: account.id },
      data: { telegramChatId: String(chatId) },
    });
  }
}

// ─── AI conversational engine ───────────────────────────────────────

async function aiRespond(userMessage: string, context: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You are the LaunchOps Content Pipeline assistant inside Telegram. You help manage a LinkedIn content pipeline with 5 stages: IDEAS, SCRIPTING, EDITING, QA, POSTED.

You have access to the user's current pipeline data below. Use it to answer questions, give advice, and suggest actions.

RESPONSE RULES:
- Be concise (2-4 sentences max unless asked for detail)
- Use emojis sparingly
- When the user asks to do something, confirm what you did
- When unsure, ask a clarifying question
- You can suggest moving posts, adding ideas, or reviewing content
- Give honest feedback on post quality (use the score field)
- If asked about a specific post, reference its score and content

PIPELINE DATA:
${context}

When the user asks you to DO something (add, move, create), respond with a JSON action block like:
{"action": "add_idea", "topic": "...", "content": "..."}
{"action": "move_post", "post_number": 3, "to_stage": "EDITING"}
{"action": "list_stage", "stage": "IDEAS"}

If no action is needed, just respond normally as text. Always include the action JSON on its own line if the user asked you to do something.`,
        },
        { role: "user", content: userMessage },
      ],
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "I couldn't process that. Try again.";
}

function parseAiAction(response: string): { action: any; reply: string } | null {
  // Look for JSON action block in the response
  const jsonMatch = response.match(/\{[^{}]*"action"[^{}]*\}/);
  if (!jsonMatch) return null;
  try {
    const action = JSON.parse(jsonMatch[0]);
    const reply = response.replace(jsonMatch[0], "").trim();
    return { action, reply };
  } catch {
    return null;
  }
}

// ─── Build pipeline context for AI ──────────────────────────────────

async function buildContext(): Promise<string> {
  const accountId = await getDefaultAccountId();
  const lines: string[] = [];

  for (const stage of STAGES) {
    const posts = await prisma.post.findMany({
      where: { accountId, stage: stage as any },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    if (posts.length === 0) {
      lines.push(`${STAGE_LABELS[stage]}: (empty)`);
    } else {
      lines.push(`${STAGE_LABELS[stage]}:`);
      posts.forEach((p, i) => {
        const preview = p.content.slice(0, 120).replace(/\n/g, " ");
        const score = p.score != null ? ` [Score: ${p.score}/100]` : "";
        const topic = p.topic ? ` (${p.topic})` : "";
        lines.push(`  ${i + 1}. ${preview}...${topic}${score}`);
      });
    }
  }

  return lines.join("\n");
}

// ─── Execute AI-decided actions ─────────────────────────────────────

async function executeAction(action: any, chatId: number) {
  const accountId = await getDefaultAccountId();

  switch (action.action) {
    case "add_idea": {
      const topic = action.topic || "Untitled";
      const content = action.content || action.topic || "New idea";
      await prisma.post.create({
        data: {
          accountId,
          content,
          topic,
          stage: "IDEAS",
          status: "DRAFT",
          aiGenerated: false,
        },
      });
      await sendMessage(chatId, `💡 Idea added: <b>${topic}</b>`);
      break;
    }
    case "move_post": {
      const num = parseInt(action.post_number);
      const toStage = (action.to_stage || "").toUpperCase();
      if (isNaN(num) || !STAGES.includes(toStage as any)) break;
      const posts = await prisma.post.findMany({
        where: { accountId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      const post = posts[num - 1];
      if (post) {
        await prisma.post.update({ where: { id: post.id }, data: { stage: toStage as any } });
        await sendMessage(
          chatId,
          `✅ Moved post #${num} → <b>${STAGE_LABELS[toStage]}</b>`
        );
      }
      break;
    }
    case "list_stage": {
      const stage = (action.stage || "").toUpperCase();
      if (!STAGES.includes(stage as any)) break;
      const posts = await prisma.post.findMany({
        where: { accountId, stage: stage as any },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      if (posts.length === 0) {
        await sendMessage(chatId, `${STAGE_LABELS[stage]}: empty`);
      } else {
        const list = posts.map((p, i) => {
          const preview = p.content.slice(0, 80).replace(/\n/g, " ");
          return `${i + 1}. ${preview}...`;
        }).join("\n\n");
        await sendMessage(chatId, `<b>${STAGE_LABELS[stage]}</b>\n\n${list}`);
      }
      break;
    }
  }
}

// ─── Proactive notifications ────────────────────────────────────────

export async function notifyTelegram(message: string) {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account?.telegramChatId) return;
  try {
    await sendMessage(Number(account.telegramChatId), message);
  } catch (e) {
    console.error("[Telegram] Notify failed:", e);
  }
}

// ─── Message handler ────────────────────────────────────────────────

async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  if (!text) return;

  // Store chat ID for proactive notifications
  await ensureChatId(chatId);

  await sendTyping(chatId);

  // ── Slash commands ──
  if (text.startsWith("/")) {
    await handleCommand(chatId, text);
    return;
  }

  // ── Conversational AI ──
  try {
    const context = await buildContext();
    const aiReply = await aiRespond(text, context);

    const parsed = parseAiAction(aiReply);

    if (parsed) {
      // AI decided to take an action
      await executeAction(parsed.action, chatId);
      if (parsed.reply) {
        await sendMessage(chatId, parsed.reply);
      }
      // Send updated pipeline context
      const newContext = await buildContext();
      const summary = await aiRespond("Give me a 1-line pipeline summary based on this data:\n" + newContext, newContext);
      await sendMessage(chatId, `\n📊 ${summary}`);
    } else {
      // Just a conversation reply
      await sendMessage(chatId, aiReply);
    }
  } catch (err: any) {
    console.error("[Telegram] AI error:", err);
    await sendMessage(chatId, `Error: ${err.message || "AI failed"}`);
  }
}

async function handleCommand(chatId: number, text: string) {
  const parts = text.split(/\s+/);
  const command = parts[0].toLowerCase().replace(/@\w+$/, "");
  const args = text.slice(parts[0].length).trim();

  try {
    const accountId = await getDefaultAccountId();

    switch (command) {
      case "/start":
      case "/help": {
        const help = [
          "<b>Welcome to LaunchOps ContentBot!</b>",
          "",
          "💬 <b>Just talk to me</b> — I understand natural language:",
          '  "what\'s in my pipeline"',
          '  "add an idea about client onboarding"',
          '  "move post 2 to editing"',
          '  "give me feedback on my latest post"',
          '  "what should I post today"',
          "",
          "⌨️ <b>Slash commands:</b>",
          "/status — Pipeline overview",
          "/list &lt;stage&gt; — List posts in a stage",
          "/view &lt;n&gt; — View post #n",
          "/move &lt;n&gt; &lt;stage&gt; — Move post to stage",
          "/idea &lt;topic&gt; — Quick-add idea",
          "/help — Show this message",
          "",
          "Stages: ideas → scripting → editing → qa → posted",
        ].join("\n");
        await sendMessage(chatId, help);
        break;
      }

      case "/status": {
        const counts = await Promise.all(
          STAGES.map(async (s) => {
            const count = await prisma.post.count({ where: { accountId, stage: s as any } });
            return { stage: s, count };
          })
        );
        const lines = counts.map(
          (c) => `${STAGE_LABELS[c.stage]}: <b>${c.count}</b>`
        );
        await sendMessage(chatId, "<b>Pipeline Status</b>\n\n" + lines.join("\n"));
        break;
      }

      case "/list": {
        const stageArg = args.toUpperCase().replace(/\s+/g, "");
        const stageMap: Record<string, string> = {
          IDEAS: "IDEAS", IDEA: "IDEAS",
          SCRIPTING: "SCRIPTING", SCRIPT: "SCRIPTING",
          EDITING: "EDITING", EDIT: "EDITING",
          QA: "QA", REVIEW: "QA", QUALITY: "QA",
          POSTED: "POSTED", POST: "POSTED", DONE: "POSTED",
        };
        const stage = stageMap[stageArg];
        if (!stage) {
          await sendMessage(chatId, `Unknown stage "${args}". Use: ideas, scripting, editing, qa, posted`);
          return;
        }
        const posts = await prisma.post.findMany({
          where: { accountId, stage: stage as any },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        if (posts.length === 0) {
          await sendMessage(chatId, `${STAGE_LABELS[stage]}: empty`);
          return;
        }
        const lines = posts.map((p, i) => {
          const preview = p.content.slice(0, 80).replace(/\n/g, " ");
          const topic = p.topic ? ` — ${p.topic}` : "";
          const score = p.score != null ? ` [${p.score}]` : "";
          return `<b>${i + 1}.</b> ${preview}...${topic}${score}`;
        });
        await sendMessage(
          chatId,
          `<b>${STAGE_LABELS[stage]}</b> (${posts.length})\n\n` + lines.join("\n\n")
        );
        break;
      }

      case "/view": {
        const num = parseInt(args);
        if (isNaN(num) || num < 1) {
          await sendMessage(chatId, "Usage: /view &lt;number&gt;");
          return;
        }
        const allPosts = await prisma.post.findMany({
          where: { accountId },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        const post = allPosts[num - 1];
        if (!post) {
          await sendMessage(chatId, `Post #${num} not found`);
          return;
        }
        const preview = post.content.slice(0, 1000);
        await sendMessage(
          chatId,
          `<b>Post #${num}</b> [${STAGE_LABELS[post.stage]}]\n\n${preview}${post.content.length > 1000 ? "\n...(truncated)" : ""}`
        );
        break;
      }

      case "/move": {
        const moveParts = args.split(/\s+/);
        const num = parseInt(moveParts[0]);
        const targetArg = (moveParts[1] || "").toUpperCase();
        if (isNaN(num) || !targetArg) {
          await sendMessage(chatId, "Usage: /move &lt;number&gt; &lt;stage&gt;");
          return;
        }
        const targetMap: Record<string, string> = {
          IDEAS: "IDEAS", IDEA: "IDEAS",
          SCRIPTING: "SCRIPTING", SCRIPT: "SCRIPTING",
          EDITING: "EDITING", EDIT: "EDITING",
          QA: "QA", REVIEW: "QA",
          POSTED: "POSTED", POST: "POSTED", DONE: "POSTED",
        };
        const target = targetMap[targetArg];
        if (!target) {
          await sendMessage(chatId, `Unknown stage "${targetArg}".`);
          return;
        }
        const allPosts = await prisma.post.findMany({
          where: { accountId },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        const post = allPosts[num - 1];
        if (!post) {
          await sendMessage(chatId, `Post #${num} not found`);
          return;
        }
        await prisma.post.update({ where: { id: post.id }, data: { stage: target as any } });
        await sendMessage(
          chatId,
          `✅ Moved post #${num} from <b>${STAGE_LABELS[post.stage]}</b> → <b>${STAGE_LABELS[target]}</b>`
        );
        break;
      }

      case "/idea": {
        if (!args) {
          await sendMessage(chatId, "Usage: /idea &lt;topic&gt; or /idea &lt;topic&gt; | &lt;content&gt;");
          return;
        }
        const pipeIdx = args.indexOf("|");
        let topic: string;
        let content: string;
        if (pipeIdx > -1) {
          topic = args.slice(0, pipeIdx).trim();
          content = args.slice(pipeIdx + 1).trim();
        } else {
          topic = args.trim();
          content = args.trim();
        }
        await prisma.post.create({
          data: {
            accountId,
            content,
            topic: topic || null,
            stage: "IDEAS",
            status: "DRAFT",
            aiGenerated: false,
          },
        });
        await sendMessage(chatId, `💡 Idea saved: <b>${topic}</b>`);
        break;
      }
    }
  } catch (err: any) {
    console.error("Telegram bot error:", err);
    await sendMessage(chatId, `Error: ${err.message || "Unknown error"}`);
  }
}

// ─── Polling ────────────────────────────────────────────────────────

export async function pollUpdates() {
  if (polling) return;
  polling = true;
  console.log("[Telegram Bot] Starting polling...");

  while (polling) {
    try {
      const res = await fetch(
        `${API}/getUpdates?offset=${offset}&timeout=30`,
        { signal: AbortSignal.timeout(35000) }
      );
      const data = await res.json();
      if (data.ok && data.result) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && err.name !== "TimeoutError") {
        console.error("[Telegram Bot] Poll error:", err.message);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
}

export function stopPolling() {
  polling = false;
  console.log("[Telegram Bot] Stopped polling.");
}

export function isPolling() {
  return polling;
}
