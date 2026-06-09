"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Eye, ArrowRight, Sparkles } from "lucide-react";
import { getLeads, getPosts } from "@/lib/api";

const weeklyData = [
  { day: "Mon", impressions: 1200, likes: 45 },
  { day: "Tue", impressions: 2400, likes: 78 },
  { day: "Wed", impressions: 1800, likes: 62 },
  { day: "Thu", impressions: 3200, likes: 95 },
  { day: "Fri", impressions: 1500, likes: 52 },
  { day: "Sat", impressions: 900, likes: 28 },
  { day: "Sun", impressions: 2100, likes: 71 },
];

export default function Dashboard() {
  const { data: leads } = useQuery({ queryKey: ["leads"], queryFn: () => getLeads() });
  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: () => getPosts({ status: "PUBLISHED" }) });
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      return res.json();
    },
  });

  const hotLeads = leads?.filter((l) => l.score >= 80).slice(0, 3) || [];
  const weekPosts = posts?.slice(0, 7).map((p) => ({
    day: new Date(p.createdAt).toLocaleDateString("en", { weekday: "short" }),
    title: p.content.split("\n")[0].slice(0, 40) + "...",
    score: p.score || 75,
    status: p.status === "PUBLISHED" ? "ready" : "draft",
  })) || [];

  const displayStats = [
    { label: "Weekly Impressions", value: `${(stats?.stats?.weeklyImpressions || 13100).toLocaleString()}`, change: "+24%", icon: Eye, color: "blue" as const },
    { label: "Engagement Rate", value: `${stats?.stats?.engagementRate || "4.8"}%`, change: "+0.6%", icon: TrendingUp, color: "green" as const },
    { label: "Pipeline Value", value: `£${((stats?.stats?.pipelineValue || 24000) / 1000).toFixed(0)}K`, change: `${stats?.stats?.hotLeads || 3} active deals`, icon: DollarSign, color: "purple" as const },
    { label: "New Leads", value: `${leads?.length || 18}`, change: "+5 this week", icon: Users, color: "yellow" as const },
  ];

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
        {displayStats.map((stat) => {
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
            <Badge variant="warning">{hotLeads.length} need action</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotLeads.length > 0 ? hotLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-3 rounded-lg cursor-pointer transition-colors"
                style={{ background: "var(--badge-bg)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{lead.name}</p>
                  <Badge variant="success" className="text-[10px]">{lead.score}</Badge>
                </div>
                {lead.company && <p className="text-xs" style={{ color: "var(--muted)" }}>{lead.company}</p>}
                {lead.notes && <p className="text-xs mt-1" style={{ color: "#60a5fa" }}>{lead.notes}</p>}
              </div>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>No hot leads yet — import some to get started</p>
            )}
            <Button variant="ghost" className="w-full text-xs">
              View All Leads <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <Badge variant="info">{posts?.length || 0} published</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {weekPosts.length > 0 ? weekPosts.map((post, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg"
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
                  <Badge variant={post.status === "ready" ? "success" : "default"} className="text-[10px] px-1.5">
                    {post.status === "ready" ? "Live" : "Draft"}
                  </Badge>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{post.score}</span>
                </div>
              </div>
            )) : (
              <div className="col-span-7 text-center py-4">
                <p className="text-sm" style={{ color: "var(--muted)" }}>No posts yet — generate your first draft</p>
              </div>
            )}
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
              {stats?.insight || "Your storytelling posts about AI agents get 3.2x more engagement than tip-based content. Best time to post: Tue-Thu, 8-10am."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
