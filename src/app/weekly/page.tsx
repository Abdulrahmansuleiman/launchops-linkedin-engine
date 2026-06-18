"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, FileText, Users, Send, Briefcase, CheckSquare, TrendingUp, CalendarDays, Brain } from "lucide-react";

const stageColors: Record<string, string> = {
  NEW: "#6b7280", CONNECTED: "#1d4ed8", DM_SENT: "#a16207",
  RESPONDED: "#1d4ed8", MEETING_BOOKED: "#15803d", DEMO_SENT: "#15803d",
  CLIENT_WON: "#15803d", CLIENT_LOST: "#b91c1c", ARCHIVED: "#6b7280",
};

export default function WeeklyReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (regenerate = false) => {
    setLoading(true);
    setError(null);
    if (regenerate) setGenerating(true);
    try {
      const res = await fetch(`/api/report/weekly${regenerate ? "?regenerate=true" : ""}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || "Failed to load report");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  const todayName = dayNames[today];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Weekly Report
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Your full week recap — every post, lead, DM, client, and task
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: today === 5 ? "#052e16" : "#1f2937", color: today === 5 ? "#4ade80" : "#9ca3af" }}>
            {today === 5 ? "It's Friday — report ready" : `Today is ${todayName}`}
          </span>
          {data && (
            <Button variant="secondary" size="sm" onClick={() => fetchReport(true)} disabled={generating} className="!text-xs">
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Refresh
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "#3b1212", color: "#fca5a5", border: "1px solid #7f1d1d" }}>
          {error}
        </div>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--muted)" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              This week's summary
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              See everything that happened this week — posts, leads, DMs, clients, tasks, and pipeline
            </p>
            <Button onClick={() => fetchReport()} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-1.5" />}
              Load This Week
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#3b82f6" }} />
            <p className="text-sm" style={{ color: "var(--foreground)" }}>Building your weekly report...</p>
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {data.weekLabel} — {data.period}
              </span>
              {data.saved && (
                <Badge variant="success" className="text-[10px]">Saved</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="!text-xs" onClick={() => fetchReport(true)} disabled={generating}>
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1" />}
              {generating ? "Regenerating..." : "Regenerate AI Summary"}
            </Button>
          </div>

          {data.narrative && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4" style={{ color: "#c084fc" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>AI Weekly Summary</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)" }}>
                  {data.narrative}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4" style={{ color: "#60a5fa" }} />
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Content</p>
                </div>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{data.posts.created}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{data.posts.published} published</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4" style={{ color: "#4ade80" }} />
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Leads</p>
                </div>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{data.leads.added}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{data.leads.connected} connected — {data.leads.total} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-4 h-4" style={{ color: "#fbbf24" }} />
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Outreach</p>
                </div>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{data.outreach.dmsSent}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>DMs sent this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4" style={{ color: "#c084fc" }} />
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Clients</p>
                </div>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{data.clients.added}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{data.clients.onboarded} onboarded — {data.clients.total} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckSquare className="w-4 h-4" style={{ color: "#f87171" }} />
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Tasks</p>
                </div>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{data.tasks.completed}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{data.tasks.added} added this week</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Pipeline Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.pipelineStages.length > 0 ? data.pipelineStages.map((s: any) => (
                  <div key={s.stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: stageColors[s.stage] || "#6b7280" }} />
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>
                        {s.stage.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{s.count}</span>
                  </div>
                )) : (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>No leads in pipeline yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
