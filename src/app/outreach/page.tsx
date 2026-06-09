"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Send, Plus, MessageCircle, CheckCircle, Clock, Zap, ChevronRight, Target, User, Building2 } from "lucide-react";

const openerTemplate = [
  "Hey [Name]",
  "[Company] looks interesting",
  "That's all you? Or you have a team",
  "You guys do [what they do] right?",
  "How long you been running it?",
  "Gotta visit [city] btw — [genuine local line]",
];

const flowSteps = [
  { step: 1, name: "Opener", desc: "Line by line, one per send. No pitch. No AI mention.", status: "active" },
  { step: 2, name: "Reply → Warm", desc: "Match energy. One casual line + ONE question about their business.", status: "active" },
  { step: 3, name: "Surface Pain", desc: "Ask about lead follow-up speed. Pick the right angle for their industry.", status: "active" },
  { step: 4, name: "Pain Pivot", desc: "If slow → cold facts. If fast → volume angle. If auto → conversion rate.", status: "active" },
  { step: 5, name: "Drop the Frame", desc: "Sell outcome, not build. Offer demo video or 20-min call.", status: "active" },
  { step: 6, name: "Book Call", desc: "Calendly link. No pitch. No deck. Just map out where leads are lost.", status: "active" },
];

const objections = [
  { them: '"We\'re doing fine"', reply: '"That\'s the best position to be in — you already have demand. Quick question: what\'s your lead-to-booked-call rate right now?"' },
  { them: '"We use a VA"', reply: '"How fast can your VA respond when a lead comes in at 9pm on a Friday? That\'s where the system breaks."' },
  { them: '"Not interested in AI"', reply: '"I get that — most people that say that have seen chatbots that feel robotic. What I build is conversational. Your leads don\'t know it\'s automated."' },
  { them: '"What does it cost?"', reply: '"Depends on what you need — that\'s what the call is for. But bigger question: how much are slow responses costing you right now?"' },
  { them: 'Gone quiet 1-2 messages', reply: '"Hey — no pressure. Curious though: what does your current lead follow-up actually look like end to end?"' },
  { them: '"Not now / too busy"', reply: '"No worries at all — drop me a message whenever the time is right 👊" — wait 2-3 weeks.' },
];

const activeConversations = [
  { name: "Jordan Blake", company: "Apex Ventures", stage: "Surface Pain", nextAction: "Ask about follow-up speed", status: "hot", city: "Manchester", messages: 4 },
  { name: "Marcus Webb", company: "ScaleUp Labs", stage: "Drop the Frame", nextAction: "Send demo video", status: "hot", city: "London", messages: 7 },
  { name: "Priya Sharma", company: "GrowthStack", stage: "Opener Sent", nextAction: "Bump in 2 days", status: "warm", city: "Dubai", messages: 1 },
  { name: "Kim Davies", company: "LeadGen Labs", stage: "Objection", nextAction: "Pivot on VA angle", status: "warm", city: "Birmingham", messages: 3 },
  { name: "Carlos Mendez", company: "Pulse Solar", stage: "Book Call", nextAction: "Send Calendly link", status: "hot", city: "Texas", messages: 9 },
];

const followUpSequence = [
  { day: "Day 1", action: "Send opener (line by line)", done: true },
  { day: "Day 4", action: "Bump: 'just bumping this up in case it got buried 👋'", done: false },
  { day: "Day 8", action: "New angle: ask about follow-up process directly", done: false },
  { day: "Day 14", action: "Move on. Mark for 30-60 day re-engage", done: false },
];

export default function Outreach() {
  const [selectedProspect, setSelectedProspect] = useState<string | null>(null);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Outreach Engine
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Ty Frankel style — casual, brotherly, research-heavy, no pitch
          </p>
        </div>
        <Button>
          <Target className="w-4 h-4 mr-1.5" />
          New Prospect
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Conversation Flow</CardTitle>
                <Badge variant="info">6 steps</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flowSteps.map((s) => (
                  <div
                    key={s.step}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: "var(--badge-bg)" }}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {s.step}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{s.name}</p>
                        {s.status === "active" && <Badge variant="success" className="text-[10px]">Active</Badge>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Opener Template</CardTitle>
                <Badge variant="warning">Line by line — one per send</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 p-4 rounded-lg font-mono text-sm leading-relaxed" style={{ background: "var(--badge-bg)", color: "var(--foreground)" }}>
                {openerTemplate.map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 shrink-0">→</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Button size="sm">
                  <Zap className="w-3.5 h-3.5 mr-1" />
                  Generate Opener
                </Button>
                <Button variant="secondary" size="sm">
                  Customize
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Objection Pivots</CardTitle>
                <Badge variant="info">6 scripts ready</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {objections.map((o, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "var(--badge-bg)" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "#f87171" }}>They say: {o.them}</p>
                    <p className="text-sm" style={{ color: "#4ade80" }}>You say: {o.reply}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Active Conversations</CardTitle>
                <Badge variant="success">{activeConversations.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeConversations.map((c) => (
                <div
                  key={c.name}
                  className="p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: selectedProspect === c.name ? "var(--nav-active)" : "var(--badge-bg)",
                    border: selectedProspect === c.name ? "1px solid var(--nav-active-border)" : "1px solid transparent",
                  }}
                  onClick={() => setSelectedProspect(c.name)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center shrink-0 font-medium">
                        {c.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{c.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{c.company} · {c.city}</p>
                      </div>
                    </div>
                    <Badge
                      variant={c.status === "hot" ? "warning" : "info"}
                      className="ml-2 shrink-0 text-[10px]"
                    >
                      {c.status === "hot" ? "🔥 Hot" : "Warm"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info" className="text-[10px]">{c.stage}</Badge>
                    <span className="text-[11px]" style={{ color: "var(--muted)" }}>{c.messages} msgs</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#60a5fa" }}>Next: {c.nextAction}</p>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs">View All Conversations</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Compose DM</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {selectedProspect ? (
                <>
                  <div className="mb-3 p-3 rounded-lg" style={{ background: "var(--badge-bg)" }}>
                    <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Sending to: {selectedProspect}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Stage: {activeConversations.find(c => c.name === selectedProspect)?.stage}</p>
                  </div>
                  <Textarea
                    defaultValue={`
Hey [Name]
[Company] looks interesting
That's all you? Or you have a team
You guys do [what they do] right?
How long you been running it?
Gotta visit [city] btw — [genuine local line]`.trim()}
                    rows={6}
                  />
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button size="sm">
                      <Zap className="w-3.5 h-3.5 mr-1" />
                      AI Optimize
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Send
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted)" }} />
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Select a conversation to compose a message</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {followUpSequence.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "var(--badge-bg)" }}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${f.done ? "bg-green-600" : "bg-gray-600"}`}>
                      {f.done ? <CheckCircle className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{f.day}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{f.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Convos", value: "5", sub: "5 in pipeline", icon: MessageCircle, color: "#60a5fa" },
          { label: "Opens This Week", value: "12", sub: "+3 from last week", icon: Send, color: "#4ade80" },
          { label: "Reply Rate", value: "62%", sub: "Industry avg: 28%", icon: CheckCircle, color: "#c084fc" },
          { label: "Calls Booked", value: "3", sub: "This month", icon: Clock, color: "#fbbf24" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg shrink-0" style={{ background: "var(--badge-bg)" }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.value}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{s.label}</p>
                  <p className="text-[10px]" style={{ color: "#4ade80" }}>{s.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real Conversation Example</CardTitle>
          <Badge variant="success">Muaaz · Agency Owner · Karachi</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { sender: "You", text: "Hey Muaaz" },
              { sender: "You", text: "NovaReach looks interesting" },
              { sender: "You", text: "That's all you? Or you have a team" },
              { sender: "You", text: "You guys do lead gen and follow-up systems for real estate brands right?" },
              { sender: "You", text: "How long you been running it?" },
              { sender: "You", text: "Gotta visit Karachi btw, heard the food scene there is absolutely insane, especially the BBQ" },
              { sender: "Lead", text: "Yeah I run NovaReach... been refining systems... And trust me 😂 Karachi BBQ won't disappoint." },
              { sender: "You", text: "haha I'm holding you to that Karachi BBQ 😂" },
              { sender: "You", text: "So when your real estate clients get leads from ads, how fast is someone actually following up on those?" },
              { sender: "Lead", text: "Honestly, the faster the follow-up, the better... I've been exploring more automation and follow-up systems lately" },
              { sender: "You", text: "that's exactly it — the follow-up gap is where most leads die" },
              { sender: "You", text: "are your real estate clients handling that part themselves or is that something you're building out for them too?" },
              { sender: "Lead", text: "Mostly clients handling it themselves... I've been looking more into automation" },
              { sender: "You", text: "that's the gap right there — clients getting leads but losing them on the follow up" },
              { sender: "You", text: "that's actually exactly what I build — automated follow up systems that respond in under 60 seconds, qualify the lead and book the call without any manual work" },
              { sender: "You", text: "would make a lot of sense for your real estate clients honestly" },
              { sender: "You", text: "want me to show you what that looks like?" },
              { sender: "Lead", text: "Yeah that actually sounds really interesting... Definitely open to seeing how your system works" },
              { sender: "You", text: "perfect — easiest is just a quick 20 mins on a call" },
              { sender: "You", text: "I'll walk you through exactly how it works and we can see if it makes sense for your clients" },
            ].map((msg, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg text-sm max-w-[80%]"
                style={{
                  background: msg.sender === "You" ? "#1e3a5f" : "#1f2937",
                  color: msg.sender === "You" ? "#60a5fa" : "var(--foreground)",
                  marginLeft: msg.sender === "You" ? "auto" : "0",
                  marginRight: msg.sender === "You" ? "0" : "auto",
                }}
              >
                <div className="text-[10px] mb-0.5 opacity-60">{msg.sender}</div>
                {msg.text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
