"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Send, Plus, MessageCircle, CheckCircle, Clock, Zap } from "lucide-react";

const sequences = [
  {
    name: "Connect DM",
    line: "Hey {{name}}, loved your post about {{topic}}. I work with agency owners on AI lead gen — any overlap?",
    delay: "Day 1",
    status: "active",
  },
  {
    name: "Follow-up 1",
    line: "Totally get it if not the right fit. I built a system that books 3-5 demos/week on autopilot using AI agents. If curious, happy to show you.",
    delay: "Day 3",
    status: "active",
  },
  {
    name: "Follow-up 2",
    line: "No pressure. Here's a 2min Loom showing exactly how it works: {{loom_link}}",
    delay: "Day 5",
    status: "active",
  },
  {
    name: "Follow-up 3",
    line: "Last one — if timing's off, no worries. I'll circle back in a few weeks. In the meantime, here's a case study: {{case_link}}",
    delay: "Day 7",
    status: "active",
  },
  {
    name: "Close",
    line: "Has this been helpful? Happy to hop on a 10min call to dive deeper. Let me know what works.",
    delay: "Day 10",
    status: "active",
  },
];

const activeOutreaches = [
  { name: "Jordan Blake", stage: "Follow-up 1", next: "Tomorrow", status: "warm" },
  { name: "Marcus Webb", stage: "Follow-up 2", next: "Today, 3pm", status: "hot" },
  { name: "Priya Sharma", stage: "Connect DM", next: "Day after tomorrow", status: "paused" },
];

export default function Outreach() {
  const [compose, setCompose] = useState("Hey {{name}}, I saw your work on {{topic}}. I help founders turn LinkedIn engagement into booked calls using AI text agents. Would love to share how — open to a quick chat?");

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Outreach Engine
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Ty Frankel style — relationship-first, research-heavy
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-1.5" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>DM Sequence</CardTitle>
            <Badge variant="success">5 steps · Live</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {sequences.map((step, i) => (
              <div
                key={step.name}
                className="p-3 rounded-lg"
                style={{ background: "var(--badge-bg)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#1e3a5f", color: "#60a5fa" }}>
                      {step.delay}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{step.name}</span>
                  </div>
                  {step.status === "active" && <Badge variant="success" className="text-[10px]">Active</Badge>}
                </div>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{step.line}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Compose DM</CardTitle>
              <Badge variant="info">{`Uses {{name}}, {{topic}}, {{loom_link}}`}</Badge>
            </CardHeader>
            <CardContent>
              <Textarea
                value={compose}
                onChange={(e) => setCompose(e.target.value)}
                rows={5}
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                <Button size="sm">
                  <Zap className="w-3.5 h-3.5 mr-1" />
                  AI Optimize
                </Button>
                <Button variant="secondary" size="sm">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Send to Selected
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Outreach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeOutreaches.map((o) => (
                <div
                  key={o.name}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--badge-bg)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{o.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{o.stage}</span>
                      <span className="text-xs" style={{ color: "#60a5fa" }}>· Next: {o.next}</span>
                    </div>
                  </div>
                  <Badge
                    variant={o.status === "hot" ? "warning" : o.status === "warm" ? "info" : "default"}
                    className="shrink-0 ml-2"
                  >
                    {o.status}
                  </Badge>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full">View All Campaigns</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Sequences", value: "3", icon: MessageCircle },
          { label: "Sent This Week", value: "47", icon: Send },
          { label: "Reply Rate", value: "62%", icon: CheckCircle },
          { label: "Demo Booked", value: "8", icon: Clock },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: "#1e3a5f" }}>
                  <Icon className="w-4 h-4" style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
                  <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
