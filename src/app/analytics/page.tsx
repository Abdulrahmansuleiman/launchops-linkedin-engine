"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ArrowUp, Target, Sparkles } from "lucide-react";

const growthData = [
  { month: "Jan", leads: 12, demos: 3 },
  { month: "Feb", leads: 18, demos: 5 },
  { month: "Mar", leads: 24, demos: 7 },
  { month: "Apr", leads: 31, demos: 9 },
  { month: "May", leads: 40, demos: 12 },
  { month: "Jun", leads: 47, demos: 15 },
];

const contentDna = [
  { label: "Client Stories", value: 35 },
  { label: "Tips & How-tos", value: 25 },
  { label: "Industry Insights", value: 20 },
  { label: "Personal Takes", value: 12 },
  { label: "Humor/Relatable", value: 8 },
];

const COLORS = ["#60a5fa", "#4ade80", "#c084fc", "#fbbf24", "#f87171"];

const topPosts = [
  { title: "\"AI agents aren't replacing humans — they're replacing slow humans\"", impressions: "3.2K", engagement: "8.7%", sentiment: "🔥 Fire" },
  { title: "\"Your leads are going to voicemail right now\"", impressions: "2.8K", engagement: "7.2%", sentiment: "🔥 Fire" },
  { title: "\"I went from losing leads at 2am to closing them in my sleep\"", impressions: "2.1K", engagement: "6.1%", sentiment: "📈 Good" },
  { title: "\"My framework for 2x conversion rates\"", impressions: "1.5K", engagement: "4.3%", sentiment: "📈 Good" },
  { title: "\"Why slow lead response costs you £50K/year\"", impressions: "900", engagement: "3.2%", sentiment: "💀 Flopped" },
];

export default function Analytics() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Analytics
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            30-day performance and AI recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Select className="w-32">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </Select>
          <Button variant="secondary" size="sm">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pipeline Growth", value: "+47%", sub: "This month", icon: TrendingUp, color: "#4ade80" },
          { label: "Conversion Rate", value: "31.9%", sub: "Lead→Demo", icon: Target, color: "#60a5fa" },
          { label: "Avg. Reply Rate", value: "62%", sub: "Last 30 days", icon: ArrowUp, color: "#c084fc" },
          { label: "Total Leads", value: "47", sub: "All time", icon: Sparkles, color: "#fbbf24" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" style={{ color: s.color }} />
                  <div>
                    <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.value}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
                    <p className="text-[10px]" style={{ color: "#4ade80" }}>{s.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Growth Trend</CardTitle>
            <Badge variant="success">+47% MTD</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <XAxis dataKey="month" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "8px" }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                  <Line type="monotone" dataKey="demos" stroke="#4ade80" strokeWidth={2} dot={{ fill: "#4ade80" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content DNA</CardTitle>
            <Badge variant="info">Client stories perform best</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={contentDna} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                      {contentDna.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {contentDna.map((c, i) => (
                  <div key={c.label} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                    <span style={{ color: "var(--foreground)" }}>{c.label}</span>
                    <span style={{ color: "var(--muted)" }}>{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Posts This Month</CardTitle>
          <Badge variant="info">Sorted by impressions</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topPosts.map((post, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--badge-bg)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>{post.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{post.impressions} impressions</span>
                    <span className="text-xs" style={{ color: "#4ade80" }}>{post.engagement} eng.</span>
                  </div>
                </div>
                <Badge
                  variant={post.sentiment.includes("Fire") ? "success" : post.sentiment.includes("Good") ? "info" : "danger"}
                  className="shrink-0 ml-2"
                >
                  {post.sentiment}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="p-4 rounded-lg"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <ul className="space-y-2">
              {[
                "Double down on client story posts — they drive 2.3x more demo bookings",
                "Best posting time: Tue-Thu 8-10am — move high-value posts to these slots",
                "Your 'voicemail' hook has the highest save rate — start more posts with a hard pain point",
                "3 leads in 'Demo Done' need follow-up within 24h — they're likely to close this week",
                "Content DNA is 60% heavy on stories/tips — try adding 1 'controversial take' per week to spark comments",
              ].map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                  <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
