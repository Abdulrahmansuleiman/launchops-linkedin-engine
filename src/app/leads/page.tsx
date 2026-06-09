"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search, Filter, MessageCircle, Send, MoreHorizontal, Target, Loader2 } from "lucide-react";
import { getLeads, importLeads, type Lead } from "@/lib/api";

const statusColor = (status: string) => {
  switch (status) {
    case "MEETING_BOOKED": case "DEMO_SENT": return "success" as const;
    case "RESPONDED": case "CONNECTED": return "info" as const;
    case "DM_SENT": return "warning" as const;
    case "CLIENT_WON": return "success" as const;
    default: return "default" as const;
  }
};

const statusLabel = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function Leads() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: allLeads = [] } = useQuery({
    queryKey: ["leads", filterStatus, search],
    queryFn: () => getLeads({ status: filterStatus, search }),
  });

  const { data: stats } = useQuery({
    queryKey: ["leads-stats"],
    queryFn: async () => {
      const all = await getLeads();
      return {
        total: all.length,
        hot: all.filter((l) => l.score >= 80).length,
        engaged: all.filter((l) => ["RESPONDED", "CONNECTED", "DM_SENT"].includes(l.status)).length,
      };
    },
  });

  const filtered = filterStatus === "all" && !search ? (allLeads || []) : (allLeads || []);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Leads
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Find high value prospects, score them, and move them through your pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={async () => {
            setImporting(true);
            setImportMsg(null);
            try {
              const urls = prompt("Enter LinkedIn profile URLs (one per line):");
              if (!urls) { setImporting(false); return; }
              const profileUrls = urls.split("\n").map((u) => u.trim()).filter(Boolean);
              const result = await importLeads(profileUrls);
              setImportMsg(`Imported ${result.imported} new leads`);
              queryClient.invalidateQueries({ queryKey: ["leads"] });
            } catch (e: any) {
              setImportMsg("Import failed: " + (e.message || "Unknown error"));
            } finally {
              setImporting(false);
              setTimeout(() => setImportMsg(null), 4000);
            }
          }} disabled={importing}>
            {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Target className="w-4 h-4 mr-1.5" />}
            {importing ? "Importing..." : "Import from LinkedIn"}
          </Button>
          {importMsg && (
            <span className="text-xs" style={{ color: importMsg.includes("failed") ? "#f87171" : "#4ade80" }}>
              {importMsg}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-36">
          <option value="all">All Status</option>
          <option value="NEW">New</option>
          <option value="CONNECTED">Connected</option>
          <option value="DM_SENT">DM Sent</option>
          <option value="RESPONDED">Responded</option>
          <option value="MEETING_BOOKED">Meeting Booked</option>
          <option value="DEMO_SENT">Demo Sent</option>
          <option value="CLIENT_WON">Client Won</option>
        </Select>
        <Button variant="secondary" size="sm" onClick={() => {
          setFilterStatus(filterStatus === "all" ? "NEW" : "all");
        }}>
          <Filter className="w-3.5 h-3.5 mr-1" /> {filterStatus === "all" ? "Filters" : "Clear Filter"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th className="text-left font-medium pb-3 pr-4">Name</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden sm:table-cell">Followers</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden md:table-cell">Status</th>
                  <th className="text-left font-medium pb-3 pr-4">Score</th>
                  <th className="text-right font-medium pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t transition-colors"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium" style={{ color: "var(--foreground)" }}>{lead.name || "Unknown"}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{lead.headline || lead.company || ""}</p>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell" style={{ color: "var(--muted)" }}>
                      {lead.followerCount ? `${(lead.followerCount / 1000).toFixed(1)}K` : "0"}
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <Badge variant={statusColor(lead.status)}>{statusLabel(lead.status)}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={lead.score >= 80 ? "text-green-400" : lead.score >= 50 ? "text-yellow-400" : ""}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="!p-1.5" onClick={() => window.location.href = "/outreach"}>
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="!p-1.5" onClick={() => window.location.href = "/outreach"}>
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="!p-1.5" onClick={() => {
                          const newStatus = prompt("Change status: NEW, CONNECTED, DM_SENT, RESPONDED, MEETING_BOOKED, DEMO_SENT, CLIENT_WON, CLIENT_LOST");
                          if (newStatus) window.location.href = `/leads`;
                        }}>
                          <MoreHorizontal className="w-4 h-4" />
        </Button>
        {importMsg && (
          <span className="text-xs" style={{ color: importMsg.includes("failed") ? "#f87171" : "#4ade80" }}>
            {importMsg}
          </span>
        )}
      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>
                      No leads found. Import from LinkedIn or adjust filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Leads", value: stats?.total ?? "0" },
          { label: "Hot (score 80+)", value: stats?.hot ?? "0" },
          { label: "Engaged", value: stats?.engaged ?? "0" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
