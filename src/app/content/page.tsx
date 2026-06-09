"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Sparkles, Check, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";

const initialDrafts = [
  {
    id: 1, day: "Monday",
    content: `AI agents aren't replacing humans — they're replacing slow humans.

I've deployed 50+ AI text agents for business owners.

Here's what actually works:

1. Response under 30 seconds (not 5 minutes)
2. Qualification first, booking second
3. Human handoff when the lead is ready
4. Follow-up sequences that don't annoy

The tech is ready. The question is: are you?

What's your biggest lead generation challenge right now? 👇`,
    score: 87, predicted: "2.5K - 3.5K",
    reason: "Hook challenges mindset, list is scannable, question drives comments",
  },
  {
    id: 2, day: "Monday",
    content: `I went from losing leads at 2am to closing them while I sleep.

Not because I hired more people.

Because I installed an AI text agent.

Most business owners think AI is complicated.

It's not.

It's just:
• Speed
• Consistency
• Follow-through

The speed of response matters more than the pitch.

Want to see how it works? Drop a comment.`,
    score: 82, predicted: "2K - 3K",
    reason: "Personal story, simple framework, strong CTA",
  },
  {
    id: 3, day: "Monday",
    content: `Your leads are going to voicemail right now.

And they're not calling back.

Here's what the top 1% of businesses do differently:

They respond in under 30 seconds.

Not 5 minutes.
Not 1 hour.
30 seconds.

I built AI text agents that do this automatically.

The result? 3x more booked calls. 40+ hours saved per week.

Want me to show you how it works? Drop a comment or DM me.`,
    score: 91, predicted: "3K - 5K",
    reason: "Pain point hook, authority, free offer drives engagement",
  },
];

export default function ContentStudio() {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [drafts] = useState(initialDrafts);
  const [selectedDraft, setSelectedDraft] = useState<number | null>(null);

  const dayDrafts = drafts.filter((d) => d.day === selectedDay);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Content Studio
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Weekly post machine — pick, publish, improve
          </p>
        </div>
        <Button>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh Drafts
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className="p-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: selectedDay === day ? "#2563eb" : "var(--badge-bg)",
              color: selectedDay === day ? "white" : "var(--muted)",
              border: selectedDay === day ? "none" : "1px solid var(--card-border)",
            }}
          >
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.slice(0,3)}</span>
            <div className="text-[10px] mt-0.5 opacity-70">3 drafts</div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {dayDrafts.map((draft) => (
          <Card
            key={draft.id}
            className="cursor-pointer transition-all"
            style={{
              borderColor: selectedDraft === draft.id ? "#3b82f6" : "var(--card-border)",
              boxShadow: selectedDraft === draft.id ? "0 0 0 1px #3b82f6" : "none",
            }}
            onClick={() => setSelectedDraft(draft.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>Option {dayDrafts.indexOf(draft) + 1}</CardTitle>
                <Badge variant="info">{draft.score}/100</Badge>
                <Badge variant="success">Pred: {draft.predicted}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line mb-3" style={{ color: "var(--foreground)" }}>{draft.content}</p>
              <div className="p-3 rounded-lg" style={{ background: "var(--badge-bg)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  <span style={{ color: "#60a5fa" }}>Why this works:</span> {draft.reason}
                </p>
              </div>
              {selectedDraft === draft.id && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button size="sm">
                    <Check className="w-3.5 h-3.5 mr-1" /> Pick This One
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Polish with AI
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Feedback (24h later)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {["Impressions","Likes","Comments","Shares","Saves"].map((m) => (
              <div key={m} className="p-3 rounded-lg text-center" style={{ background: "var(--badge-bg)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{m}</p>
                <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>—</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button variant="secondary" size="sm">
              <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Great
            </Button>
            <Button variant="secondary" size="sm">Average</Button>
            <Button variant="secondary" size="sm">
              <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Flopped
            </Button>
          </div>
          <Textarea placeholder="How did this post perform? Notes for the AI to learn from..." rows={2} />
          <Button className="mt-2" size="sm">Submit Feedback</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { rank: 1, title: "AI agents save 40+ hrs/week", impressions: "3.2K", rating: "Great" },
              { rank: 2, title: "My framework for 2x conversion", impressions: "2.1K", rating: "Good" },
              { rank: 3, title: "Why most lead gen systems fail", impressions: "800", rating: "Flopped" },
            ].map((post) => (
              <div key={post.rank} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--badge-bg)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base font-bold shrink-0" style={{ color: "var(--muted)" }}>#{post.rank}</span>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>{post.title}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{post.impressions} impressions</p>
                  </div>
                </div>
                <Badge variant={post.rating === "Great" ? "success" : post.rating === "Good" ? "info" : "danger"} className="shrink-0 ml-2">
                  {post.rating === "Great" ? "🔥 Great" : post.rating === "Good" ? "📈 Good" : "💀 Flopped"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
