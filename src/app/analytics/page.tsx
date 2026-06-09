"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ArrowUp, Target, Sparkles } from "lucide-react";
import { getPosts, getLeads } from "@/lib/api";

const COLORS = ["#60a5fa", "#4ade80", "#c084fc", "#fbbf24", "#f87171"];

const growthData = [
  { month: "Jan", leads: 0, demos: 0 },
  { month: "Feb", leads: 0, demos: 0 },
  { month: "Mar", leads: 0, demos: 0 },
  { month: "Apr", leads: 0, demos: 0 },
  { month: "May", leads: 0, demos: 0 },
  { month: "Jun", leads: 0, demos: 0 },
];

export default function Analytics() {
  const { data: posts = [] } = useQuery({ queryKey: ["analytics-posts"], queryFn: () => getPosts({ status: "PUBLISHED" }) });
  const { data: leads = [] } = useQuery({ queryKey: ["analytics-leads"], queryFn: () => getLeads() });

  const totalImpressions = posts.reduce((s, p) => s + (p.impressions || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0);
  const engRate = totalImpressions > 0 ? ((totalLikes + totalComments) / totalImpressions * 100).toFixed(1) : "0";
  const demosBooked = leads.filter((l) => l.status === "MEETING_BOOKED" || l.status === "DEMO_SENT").length;

  growthData[growthData.length - 1] = { month: "Jun", leads: leads.length, demos: demosBooked };

  const topPosts = [...posts]
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, 5)
    .map((p) => ({
      title: p.content.split("\n")[0].slice(0, 60) + (p.content.length > 60 ? "..." : ""),
      impressions: p.impressions || 0,
      engagement: p.impressions && p.impressions > 0
        ? `${((((p.likes || 0) + (p.comments || 0)) / p.impressions) * 100).toFixed(1)}%`
        : "0%",
      sentiment: (p.impressions || 0) >= 2000 ? "🔥 Fire" : (p.impressions || 0) >= 1000 ? "📈 Good" : "💀 Flopped",
    }));

  const contentDna = [
    { label: "Client Stories", value: 35 },
    { label: "Tips & How-tos", value: 25 },
    { label: "Industry Insights", value: 20 },
    { label: "Personal Takes", value: 12 },
    { label: "Humor/Relatable", value: 8 },
  ];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Analytics
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            See what's working and what needs to change
          </p>
        </div>
        <div className="flex gap-2">
          <Select className="w-32">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </Select>
          <Button variant="secondary" size="sm" onClick={() => alert("AI will generate a full performance report with recommendations based on your data.")}>
            <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Leads", value: leads.length.toString(), sub: "All time", icon: TrendingUp, color: "#4ade80" },
          { label: "Total Impressions", value: totalImpressions.toLocaleString(), sub: "Across all posts", icon: Target, color: "#60a5fa" },
          { label: "Engagement Rate", value: `${engRate}%`, sub: "Avg per post", icon: ArrowUp, color: "#c084fc" },
          { label: "Demos Booked", value: demosBooked.toString(), sub: "From LinkedIn", icon: Sparkles, color: "#fbbf24" },
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
            <Badge variant="success">+{leads.length} total leads</Badge>
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
          <CardTitle>Top Posts</CardTitle>
          <Badge variant="info">Sorted by impressions</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topPosts.length > 0 ? topPosts.map((post, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--badge-bg)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>{post.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{post.impressions.toLocaleString()} impressions</span>
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
            )) : (
              <p className="text-center py-4 text-sm" style={{ color: "var(--muted)" }}>No published posts yet</p>
            )}
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
                `Your top post reached ${topPosts[0]?.impressions.toLocaleString() || "—"} impressions — analyze what made it work`,
                `${demosBooked} leads in demo stages need follow-up within 24h`,
                "Try adding 1 controversial take per week to spark comments",
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
