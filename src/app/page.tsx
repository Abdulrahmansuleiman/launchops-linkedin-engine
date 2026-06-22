"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Eye, ArrowRight, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, Loader2, CheckSquare, AlertTriangle, Clock } from "lucide-react";
import { getLeads, getPosts, generateDrafts } from "@/lib/api";

const TOPICS = ["AI agents for business", "Lead follow-up automation", "Sales outreach that works"];

export default function Dashboard() {
  const [insightFeedback, setInsightFeedback] = useState<"helpful" | "not-helpful" | null>(null);
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => getLeads() });
  const { data: posts = [] } = useQuery({ queryKey: ["posts"], queryFn: () => getPosts({ status: "PUBLISHED" }) });
  const { data: statsRes } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      return res.json();
    },
  });

  const stats = statsRes?.stats;
  const weeklyData = statsRes?.weeklyChart || [
    { day: "Mon", impressions: 0, likes: 0 },
    { day: "Tue", impressions: 0, likes: 0 },
    { day: "Wed", impressions: 0, likes: 0 },
    { day: "Thu", impressions: 0, likes: 0 },
    { day: "Fri", impressions: 0, likes: 0 },
    { day: "Sat", impressions: 0, likes: 0 },
    { day: "Sun", impressions: 0, likes: 0 },
  ];

  const { data: tasks } = useQuery({
    queryKey: ["tasks-overview"],
    queryFn: async () => {
      const [all, overdue, today, pipeline, client, highPriority, pending] = await Promise.all([
        fetch("/api/tasks").then(r => r.json()),
        fetch("/api/tasks?status=todo,waiting,in_progress").then(r => r.json()),
        fetch("/api/tasks?status=todo,in_progress").then(r => r.json()),
        fetch("/api/tasks?scope=pipeline").then(r => r.json()),
        fetch("/api/tasks?scope=client").then(r => r.json()),
        fetch("/api/tasks?priority=high&status=todo,in_progress").then(r => r.json()),
        fetch("/api/tasks?status=todo").then(r => r.json()),
      ])
      const now = new Date()
      return {
        total: all.length,
        overdue: all.filter((t: any) => t.status !== "done" && t.deadline && new Date(t.deadline) < now).length,
        today: all.filter((t: any) => t.status !== "done" && t.deadline && new Date(t.deadline).toDateString() === now.toDateString()).length,
        pipeline: pipeline.length,
        client: client.length,
        highPriority: highPriority.length,
        pending: pending.length,
      }
    },
  });

  const hotLeads = leads.filter((l) => l.score >= 80).slice(0, 3);
  const weekPosts = posts.slice(0, 7).map((p) => ({
    day: new Date(p.createdAt).toLocaleDateString("en", { weekday: "short" }),
    title: p.content.split("\n")[0].slice(0, 40) + "...",
    score: p.score || 75,
    status: p.status === "PUBLISHED" ? "ready" : "draft",
  }));

  const displayStats = [
    { label: "Weekly Impressions", value: `${(stats?.weeklyImpressions || 0).toLocaleString()}`, change: `${stats?.totalImpressions ? `Total: ${stats.totalImpressions.toLocaleString()}` : "No data yet"}`, icon: Eye, color: "blue" as const },
    { label: "Engagement Rate", value: `${stats?.engagementRate || "0"}%`, change: `${stats?.totalLikes || 0} total likes`, icon: TrendingUp, color: "green" as const },
    { label: "Pipeline Value", value: `£${((stats?.pipelineValue || 0) / 1000).toFixed(0)}K`, change: `${stats?.hotLeads || 0} active deals in pipeline`, icon: DollarSign, color: "purple" as const },
    { label: "New Leads", value: `${stats?.newLeadsThisWeek || 0}`, change: `${leads.length} total in pipeline`, icon: Users, color: "yellow" as const },
  ];

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      await generateDrafts(topic);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (e: any) {
      console.error("Generate failed:", e);
    } finally {
      setGenerating(false);
    }
  }, [queryClient]);

  const handleInsightFeedback = useCallback((type: "helpful" | "not-helpful") => {
    setInsightFeedback(type);
  }, []);

  const handleRefreshInsight = useCallback(async () => {
    setInsightFeedback(null);
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  }, [queryClient]);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            How your LinkedIn is growing this week
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
          {generating ? "Generating..." : "Generate This Week"}
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
                    style={{ background: `var(--stat-${stat.color}-bg)` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: `var(--stat-${stat.color}-icon)` }} />
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
            <div className="flex items-center gap-2">
              <CardTitle>This Week</CardTitle>
              <Badge variant="success">{stats?.totalPosts || 0} posts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {weeklyData.some((d: { impressions: number; likes: number }) => d.impressions > 0 || d.likes > 0) ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} />
                    <YAxis stroke="var(--muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "8px" }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Bar dataKey="impressions" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Impressions" />
                    <Bar dataKey="likes" fill="#4ade80" radius={[4, 4, 0, 0]} name="Likes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center">
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  No metrics yet — publish a post and update its metrics
                </p>
              </div>
            )}
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
                className="p-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
                style={{ background: "var(--badge-bg)" }}
                onClick={() => window.location.href = "/leads"}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{lead.name}</p>
                  <Badge variant="success" className="text-[10px]">{lead.score}</Badge>
                </div>
                {lead.company && <p className="text-xs" style={{ color: "var(--muted)" }}>{lead.company}</p>}
                {lead.notes && <p className="text-xs mt-1" style={{ color: "#60a5fa" }}>{lead.notes}</p>}
              </div>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                No hot leads yet. Import some from LinkedIn to get started
              </p>
            )}
            <Button variant="ghost" className="w-full text-xs" onClick={() => window.location.href = "/leads"}>
              View All Leads <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Overview</CardTitle>
          <div style={{ display: "flex", gap: 4 }}>
            <Badge variant="warning">{tasks?.overdue || 0} overdue</Badge>
            <Badge variant="info">{tasks?.today || 0} today</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              className="p-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
              style={{ background: "var(--badge-bg)", border: "1px solid var(--card-border)" }}
              onClick={() => window.location.href = "/tasks?scope=pipeline"}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4" style={{ color: "#6366f1" }} />
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Pipeline</p>
              </div>
              <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{tasks?.pipeline || 0}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>tasks across stages</p>
            </div>
            <div
              className="p-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
              style={{ background: "var(--badge-bg)", border: "1px solid var(--card-border)" }}
              onClick={() => window.location.href = "/tasks?scope=client"}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" style={{ color: "#22c55e" }} />
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Client</p>
              </div>
              <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{tasks?.client || 0}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>client tasks</p>
            </div>
            <div
              className="p-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
              style={{ background: "var(--badge-bg)", border: "1px solid var(--card-border)" }}
              onClick={() => window.location.href = "/tasks?priority=high&status=todo"}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} />
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>High Priority</p>
              </div>
              <p className="text-xl font-bold" style={{ color: "#ef4444" }}>{tasks?.highPriority || 0}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>need attention now</p>
            </div>
            <div
              className="p-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
              style={{ background: "var(--badge-bg)", border: "1px solid var(--card-border)" }}
              onClick={() => window.location.href = "/tasks?status=todo"}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" style={{ color: "#f97316" }} />
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Pending</p>
              </div>
              <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{tasks?.pending || 0}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>not yet started</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full mt-3 text-xs" onClick={() => window.location.href = "/tasks"}>
            View All Tasks <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <Badge variant="info">{posts.length || 0} published</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {weekPosts.length > 0 ? weekPosts.map((post, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg cursor-pointer hover:opacity-80 transition-all"
                style={{
                  background: "var(--badge-bg)",
                  border: "1px solid var(--card-border)",
                }}
                onClick={() => window.location.href = "/content"}
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
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  No posts yet. Generate your first draft to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>AI Insight</CardTitle>
            <RefreshCw
              className="w-4 h-4 cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: "var(--muted)" }}
              onClick={handleRefreshInsight}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="p-4 rounded-lg cursor-pointer transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
            onClick={() => handleInsightFeedback("helpful")}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              {stats?.insight || "Your storytelling posts about AI agents get 3.2x more engagement than tip-based content. Best time to post is Tuesday through Thursday 8 to 10am."}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs" style={{ color: "var(--muted)" }}>Was this helpful?</span>
              <ThumbsUp
                className={`w-3.5 h-3.5 cursor-pointer transition-colors ${insightFeedback === "helpful" ? "text-green-400" : ""}`}
                style={{ color: insightFeedback === "helpful" ? "#4ade80" : "var(--muted)" }}
                onClick={(e) => { e.stopPropagation(); handleInsightFeedback("helpful"); }}
              />
              <ThumbsDown
                className={`w-3.5 h-3.5 cursor-pointer transition-colors ${insightFeedback === "not-helpful" ? "text-red-400" : ""}`}
                style={{ color: insightFeedback === "not-helpful" ? "#f87171" : "var(--muted)" }}
                onClick={(e) => { e.stopPropagation(); handleInsightFeedback("not-helpful"); }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
