"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Eye, ArrowRight, Sparkles } from "lucide-react";

const weeklyData = [
  { day: "Mon", impressions: 1200, likes: 45 },
  { day: "Tue", impressions: 2400, likes: 78 },
  { day: "Wed", impressions: 1800, likes: 62 },
  { day: "Thu", impressions: 3200, likes: 95 },
  { day: "Fri", impressions: 1500, likes: 52 },
  { day: "Sat", impressions: 900, likes: 28 },
  { day: "Sun", impressions: 2100, likes: 71 },
];

const weekPosts = [
  { day: "Mon", title: "AI agents save 40+ hrs/week", score: 87, status: "ready" },
  { day: "Tue", title: "Why most lead gen systems fail", score: 74, status: "draft" },
  { day: "Wed", title: "My framework for 2x conversion", score: 92, status: "pick" },
  { day: "Thu", title: "Text agents vs VAs", score: 81, status: "draft" },
  { day: "Fri", title: "The AI advantage in 2026", score: 78, status: "draft" },
  { day: "Sat", title: "Client acquisition playbook", score: 85, status: "draft" },
  { day: "Sun", title: "Why speed beats perfection", score: 90, status: "draft" },
];

const hotLeads = [
  { name: "Sarah Chen", company: "TechVentures", detail: "Commented 3x this week", score: 92 },
  { name: "Mike Rivera", company: "GrowthLab", detail: "Liked 5 posts", score: 88 },
  { name: "Lisa Park", company: "Apex Agency", detail: "DM'd you yesterday", score: 95 },
];

export default function Dashboard() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Your LinkedIn growth at a glance
          </p>
        </div>
        <Button>
          <Sparkles className="w-4 h-4 mr-1.5" />
          Generate This Week
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Weekly Impressions", value: "13.1K", change: "+24%", icon: Eye, color: "blue" },
          { label: "Engagement Rate", value: "4.8%", change: "+0.6%", icon: TrendingUp, color: "green" },
          { label: "Pipeline Value", value: "£24K", change: "3 active deals", icon: DollarSign, color: "purple" },
          { label: "New Leads", value: "18", change: "+5 this week", icon: Users, color: "yellow" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{
                      background: stat.color === "blue" ? "#1e3a5f" :
                                  stat.color === "green" ? "#052e16" :
                                  stat.color === "purple" ? "#3b0764" : "#451a03",
                    }}
                  >
                    <Icon className="w-4 h-4" style={{
                      color: stat.color === "blue" ? "#60a5fa" :
                             stat.color === "green" ? "#4ade80" :
                             stat.color === "purple" ? "#c084fc" : "#fbbf24",
                    }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{stat.label}</p>
                    <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{stat.value}</p>
                    <p className="text-xs" style={{ color: stat.change.startsWith("+") ? "#4ade80" : "var(--muted)" }}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Impressions</CardTitle>
            <Badge variant="success">+24% this week</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "8px" }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="impressions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hot Leads</CardTitle>
            <Badge variant="warning">3 need action</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotLeads.map((lead) => (
              <div
                key={lead.name}
                className="p-3 rounded-lg cursor-pointer transition-colors"
                style={{ background: "var(--badge-bg)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{lead.name}</p>
                  <Badge variant="success" className="text-[10px]">{lead.score}</Badge>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{lead.company}</p>
                <p className="text-xs mt-1" style={{ color: "#60a5fa" }}>{lead.detail}</p>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-xs">
              View All Leads <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This Week's Posts</CardTitle>
          <Badge variant="info">7 posts planned</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekPosts.map((post) => (
              <div
                key={post.day}
                className="p-2.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: "var(--badge-bg)",
                  border: "1px solid var(--card-border)",
                }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{post.day}</p>
                <p className="text-xs leading-snug mb-2 line-clamp-2" style={{ color: "var(--foreground)" }}>
                  {post.title}
                </p>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      post.status === "ready" ? "success" :
                      post.status === "pick" ? "warning" : "default"
                    }
                    className="text-[10px] px-1.5"
                  >
                    {post.status === "ready" ? "Ready" :
                     post.status === "pick" ? "Pick" : "Draft"}
                  </Badge>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{post.score}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="p-4 rounded-lg"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              Your storytelling posts about AI agents get <strong style={{ color: "#60a5fa" }}>3.2x more engagement</strong> than tip-based content.
              Best time to post: <strong style={{ color: "#4ade80" }}>Tue-Thu, 8-10am</strong>.
              Next recommended topic: <strong style={{ color: "#c084fc" }}>"Why slow lead response costs you £50K/year"</strong> — predicted 3-5K impressions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
