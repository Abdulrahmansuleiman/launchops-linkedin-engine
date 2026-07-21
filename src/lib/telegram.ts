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

async function getDefaultAccountId() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) throw new Error("No account found");
  return account.id;
}

function parseArgs(text: string, command: string) {
  const withoutCmd = text.replace(new RegExp(`^/${command}\\s*`, "i"), "").trim();
  return withoutCmd;
}

async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  if (!text.startsWith("/")) return;

  const parts = text.split(/\s+/);
  const command = parts[0].toLowerCase().replace(/@\w+$/, "");
  const args = text.slice(parts[0].length).trim();

  try {
    const accountId = await getDefaultAccountId();

    switch (command) {
      case "/start":
      case "/help": {
        const help = [
          "<b>LaunchOps Content Pipeline Bot</b>",
          "",
          "/status — Pipeline overview (post counts per stage)",
          "/list &lt;stage&gt; — List posts in a stage (e.g. /list ideas)",
          "/view &lt;n&gt; — View post #n content",
          "/move &lt;n&gt; &lt;stage&gt; — Move post #n to a stage",
          "/idea &lt;topic&gt; — Quick-add an idea (content = topic)",
          "/idea &lt;topic&gt; | &lt;content&gt; — Add idea with separate content",
          "/help — Show this message",
          "",
          "<b>Stages:</b> ideas → scripting → editing → qa → posted",
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
          await sendMessage(chatId, `No posts in ${STAGE_LABELS[stage]}`);
          return;
        }
        const lines = posts.map((p, i) => {
          const preview = p.content.slice(0, 80).replace(/\n/g, " ");
          const topic = p.topic ? ` — ${p.topic}` : "";
          return `<b>${i + 1}.</b> ${preview}...${topic}`;
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
          await sendMessage(chatId, "Usage: /view &lt;number&gt; (use /list to see numbers)");
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
          await sendMessage(chatId, "Usage: /move &lt;number&gt; &lt;stage&gt;\nExample: /move 2 scripting");
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
          await sendMessage(chatId, `Unknown stage "${targetArg}". Use: ideas, scripting, editing, qa, posted`);
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
        const oldStage = post.stage;
        await prisma.post.update({ where: { id: post.id }, data: { stage: target as any } });
        await sendMessage(
          chatId,
          `✅ Moved post #${num} from <b>${STAGE_LABELS[oldStage]}</b> → <b>${STAGE_LABELS[target]}</b>`
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
        const post = await prisma.post.create({
          data: {
            accountId,
            content,
            topic: topic || null,
            stage: "IDEAS",
            status: "DRAFT",
            aiGenerated: false,
          },
        });
        await sendMessage(
          chatId,
          `💡 Idea saved!\n\n<b>${topic}</b>\n${content.slice(0, 200)}`
        );
        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    console.error("Telegram bot error:", err);
    await sendMessage(chatId, `Error: ${err.message || "Unknown error"}`);
  }
}

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
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        // Timeout is expected with long polling, continue
      } else {
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
